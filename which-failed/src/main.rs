use which_failed_macro::which_failed;

fn main() {
    let wife = true;
    let admin = false;
    let open = true;

    which_failed!(name, if wife && admin && open {
        println!("{name} failed");
    });

    println!("\n--- Testing different failure scenarios ---\n");

    let a = false;
    let b = true;
    let c = true;
    which_failed!(failed, if a && b && c {
        println!("First test: {failed} failed");
    });

    let x = true;
    let y = true;
    let z = false;
    which_failed!(which, if x && y && z {
        println!("Second test: {which} failed");
    });

    let p = true;
    let q = true;
    let r = true;
    which_failed!(nope, if p && q && r {
        println!("This should NOT print: {nope}");
    });

    let val = 5;
    which_failed!(expr_name, if val > 3 && val < 4 && val == 5 {
        println!("Complex expr test: {expr_name} failed");
    });

    println!("\nDone!");
}
