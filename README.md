# MedLink 🌐🚀

The MedLink is a web-based application that connects doctors, patients, and administrators to manage virtual consultations, health records, and appointments. This system has three portals: Admin, Doctor, and Patient, each with distinct functionalities to streamline the healthcare process. Key features include appointment management, notifications, automated reminders, and emergency form submission to ensure prompt treatment.

## Table of Contents 📃
  - [Technologies Used](#technologies-used)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Features](#features)
  - [Database Models](#database-models)
  - [Folder Structure](#folder-structure)
  - [Usage](#usage)
  - [Notifications and Reminders](#notifications-and-reminders)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

## Technologies Used 👨‍💻
   ### Backend: 
   - Node.js
   - Express.js
     
   ### Frontend:
   - HTML
   - CSS
   - EJS
   
   ### Database: MongoDB
   ### File Upload: Multer
   ### Notifications: Nodemailer, Node-cron
   ### Session Management: express-session


## Prerequisites ⚙️
Ensure you have the following installed:
- **Node.js**: [Download and install](https://nodejs.org/)
- **MongoDB**: You can use MongoDB Atlas for a cloud-based database.
- 
## Installation 🔨
   1. Clone the repository:
      ```bash
      git clone https://github.com/your-username/doctor-patient-portal.git
      cd doctor-patient-portal
   2. Install dependencies:
      ```bash
      npm install
   
   3. Configure MongoDB connection: Update the MongoDB URL in the code as per your setup.
      
   5. Configure environment variables:
      Email credentials for nodemailer in transporter setup.
      Session secret for session management.
    
   6. Run the application:
      ```bash
      npm start
   
   7. Access the application at http://localhost:3000.


## Features 🌟

   ### Admin Portal
   
   **Doctor Verification:** Approve or reject doctor registration requests after reviewing uploaded credentials.
   
   **Manage Appointments:** View all scheduled appointments.
   
   **Upload Test Reports:** Upload test results and reports for patients.
   
   **Emergency Form:** Provides a quick form for emergency cases for immediate medical attention.
   
   ### Doctor Portal
   
   **Appointment Management:** Approve or reject patient appointments.
   
   **Medical Diagnosis:** Add diagnosis and update patient records.
   
   **Profile Management:** Update profile details, including experience, availability, and consultation timings.
   
   **View Patient History:** Access the medical history of patients.

   ### Patient Portal
   
   **Book Appointments:** Request appointments with available doctors.
   
   **View Reports and History:** Access personal medical history and view test reports.
   
   **Receive Notifications:** Get updates on appointment status, test results, and diagnoses.
   
   ### Additional Features
   
   **Automated Reminders:** Sends reminders to patients with appointments scheduled for the day.
   
   **Notifications:** Email notifications for various activities (e.g., appointment status changes, report uploads).

## Database Models 🔧

  ### Admin
  
  *Fields:* Email, Password
  
  Manages doctors and uploads test reports.
  
  ### Doctor
  
  *Fields:* Name, Specialization, Credentials, Experience, Availability, Timings, Appointments
  
  Can approve/reject appointments, add diagnoses, and view patient medical histories.
  
  ### Patient
  
  *Fields:* Name, Email, Medical History, Appointments, Test Reports
  
  Can book appointments, view medical history, and access test reports.
 
  ### Appointment
  
  *Fields:* Patient ID, Doctor ID, Status (Pending/Approved/Rejected), Date, Time
  
  Links patients and doctors, storing the status of each appointment.
  
## Folder Structure 📂
  
| Directory/File        | Description                                   |  
|-----------------------|-----------------------------------------------|
| /middleware           | # Middlewares                                 |
| /routes               | # All routes and Endpoints                    |
| /views                | # EJS template files for rendering            |
| /models               | # Mongoose schema and models                  |
| index.js              | # Main server file                            |
| package.json          | # Project dependencies and scripts            |


## Usage 💻
   ### Admin Tasks 🔑
   1. Log in and navigate to the doctor verification section to manage doctor applications.
   2. Access the appointment section to view all appointments.
   3. Upload patient reports and handle emergency forms as needed.

   ### Doctor Tasks 🔑
   1. Log in and update your profile, including experience and availability.
   2. Access appointments to approve/reject requests and add diagnoses for patients.

   ### Patient Tasks 🔑
   1. Register or log in to request appointments and view test reports.
   2. Check appointment status and access notifications for updates.

## Notifications and Reminders 🔑
   1. Nodemailer for Email Notifications:
      1. Admin, doctor, and patient notifications for appointment updates, test report uploads, and registration status.
      2. Configuration: Use nodemailer with SMTP settings for Gmail.
   2. Node-cron for Daily Reminders:
      1. Daily appointment reminders for patients scheduled with appointments for that day.
      2. Scheduled using node-cron to run a check and send reminders every day.
     
## Contributing 🤝
  Contributions are welcome! If you have suggestions or find any bugs, feel free to open an issue or create a pull request.
  
  ### Steps to Contribute:
  1. Fork the repository.
  2. Create a new branch:
     ```bash
     git checkout -b feature-branch
  3. Commit your changes:
     ```bash
     git commit -m "Description of changes"
  4. Push to your forked repository:
     ```bash
     git push origin feature-branch
  5. Create a pull request on the main repository.

     
## License 📄
This project is licensed under the MIT License.

## Acknowledgments 📄
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Node-cron Documentation](https://www.npmjs.com/package/node-cron)
