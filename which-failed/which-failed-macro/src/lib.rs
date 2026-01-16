use proc_macro::TokenStream;
use proc_macro2::TokenTree;
use quote::{quote, ToTokens};
use syn::{
    parse::{Parse, ParseStream},
    parse_macro_input,
    Block, Expr, Ident, Token,
};

struct WhichFailedInput {
    binding: Ident,
    conditions: Vec<Expr>,
    body: Block,
}

impl Parse for WhichFailedInput {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let binding: Ident = input.parse()?;
        input.parse::<Token![,]>()?;
        input.parse::<Token![if]>()?;

        let mut condition_tokens = Vec::new();
        while !input.peek(syn::token::Brace) {
            let tt: TokenTree = input.parse()?;
            condition_tokens.push(tt);
        }

        let conditions = split_conditions(condition_tokens)?;
        let body: Block = input.parse()?;

        Ok(WhichFailedInput {
            binding,
            conditions,
            body,
        })
    }
}

fn split_conditions(tokens: Vec<TokenTree>) -> syn::Result<Vec<Expr>> {
    let mut conditions = Vec::new();
    let mut current = Vec::new();

    let mut iter = tokens.into_iter().peekable();
    while let Some(tt) = iter.next() {
        if let TokenTree::Punct(ref p) = tt {
            if p.as_char() == '&' {
                if let Some(TokenTree::Punct(next_p)) = iter.peek() {
                    if next_p.as_char() == '&' {
                        iter.next();
                        if !current.is_empty() {
                            let ts: proc_macro2::TokenStream = current.drain(..).collect();
                            let expr: Expr = syn::parse2(ts)?;
                            conditions.push(expr);
                        }
                        continue;
                    }
                }
            }
        }
        current.push(tt);
    }

    if !current.is_empty() {
        let ts: proc_macro2::TokenStream = current.into_iter().collect();
        let expr: Expr = syn::parse2(ts)?;
        conditions.push(expr);
    }

    Ok(conditions)
}

#[proc_macro]
pub fn which_failed(input: TokenStream) -> TokenStream {
    let WhichFailedInput {
        binding,
        conditions,
        body,
    } = parse_macro_input!(input as WhichFailedInput);

    if conditions.is_empty() {
        return quote! { compile_error!("which_failed! requires at least one condition"); }.into();
    }

    let mut result = quote! {};

    for (i, cond) in conditions.iter().enumerate() {
        let cond_str = cond.to_token_stream().to_string();

        if i == 0 {
            result = quote! {
                if !(#cond) {
                    let #binding = #cond_str;
                    #body
                }
            };
        } else {
            result = quote! {
                #result else if !(#cond) {
                    let #binding = #cond_str;
                    #body
                }
            };
        }
    }

    result.into()
}
