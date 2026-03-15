# Universal Lead Dashboard

Universal Lead Dashboard is a lightweight **admin dashboard for managing Netlify Form submissions**. It provides a simple interface to **view, organize, and export leads collected from Netlify Forms** without requiring a backend server.

The project is built with **HTML, CSS, and JavaScript** and is designed to work with **Netlify deployments**, making it easy to integrate with any website that uses Netlify Forms.

---

## Features

* Clean admin dashboard interface
* Displays Netlify form submissions in a table
* Export leads to **Excel (.xlsx)**
* Export leads to **CSV**
* Handles **English and Arabic text (UTF-8 encoding)**
* Responsive layout for easy lead management
* Lightweight setup with no complex frameworks

---

## Tech Stack

Frontend:

* HTML5  
* CSS3  
* Vanilla JavaScript  

Data Source:

* Netlify Forms  
* Netlify API

Exports:

* SheetJS (XLSX)
* Native Blob API (CSV)

---

## Project Structure


/universal-lead-dashboard
│
├── admin.html
├── style.css
├── script.js
└── README.md


---

## Netlify Forms Integration

The dashboard retrieves submissions from **Netlify Forms** using the Netlify API.

Example configuration in `script.js`:

```javascript
const NETLIFY_ACCESS_TOKEN = "your_netlify_access_token";
const FORM_ID = "your_netlify_form_id";

These values allow the dashboard to fetch and display form submissions from your Netlify project.

Local Development

You can run the dashboard locally by simply opening:

admin.html

Or by using a local development server such as VS Code Live Server.

Deployment

The project can be deployed easily with Netlify.

Push the project to GitHub

Connect the repository to Netlify

Deploy the site

Netlify will automatically build and host the dashboard.

Security Note

This project currently accesses the Netlify API directly from the frontend using a Personal Access Token.

For better security in production environments, consider:

Moving API requests to a serverless function

Using environment variables

Avoiding exposure of the access token in the client code

Author

Aymen HAKKAOUI
Computer Science Student — FSAC Casablanca
