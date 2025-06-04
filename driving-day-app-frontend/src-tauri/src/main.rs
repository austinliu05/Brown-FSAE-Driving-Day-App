// use tauri::{Window, Manager};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


// Creates a Tauri Command that prints something (can be invoked by JavaScript)
#[tauri::command]
fn greet(name: &str) -> String {
   format!("Hello, {}!", name)
}

#[tauri::command]
fn maximize_window(window: tauri::Window) {
    window.maximize().unwrap();
}


fn main() {

  // Registers the following function, greet()
  // Allows JavaScript to invoke this function (JavaScript from frontend can essentially invoke Rust calls, which are abstracted)
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet, maximize_window])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
  
  //   // Actually runs the application 
  // app_lib::run();
}
