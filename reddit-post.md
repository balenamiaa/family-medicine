# which_failed! - A macro that tells you exactly which condition failed in compound boolean expressions

Hey rustaceans,

I built a small proc macro that's been surprisingly useful for debugging. Ever had a long chain of `&&` conditions and needed to figure out which one was `false`?

```rust
use which_failed_macro::which_failed;

fn main() {
    let is_authenticated = true;
    let has_permission = false;
    let is_active = true;

    which_failed!(reason, if is_authenticated && has_permission && is_active {
        println!("Access denied: {reason} was false");
    });
}
```

Output:
```
Access denied: has_permission was false
```

The macro expands your `&&` chain into individual checks and binds the failing condition's name to your variable. No more sprinkling `dbg!()` everywhere or adding temporary `if` statements to narrow things down.

Works with complex expressions too:

```rust
let user_age = 16;
which_failed!(failed, if user_age >= 18 && user_age <= 65 && is_verified {
    println!("Validation failed: {failed}");
});
// Output: Validation failed: user_age >= 18
```

The implementation uses `syn` and `quote` to parse the `&&` tokens and generate the expanded checks at compile time. Around 100 lines of macro code.

GitHub: [your-repo-link]

Would love feedback. Planning to add support for `||` chains next if there's interest.
