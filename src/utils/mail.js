import Mailgen from "mailgen";
import nodemailer from "nodemailer";


const sendEmail = async (options)=>{
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagelink.com"
        }
    });

    const textEmail = mailGenerator.generatePlaintext(options.mailgenContent);
    const htmlEmail = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.GMAIL_SMTP_HOST,
        port: process.env.GMAIL_SMTP_PORT,
        secure: process.env.GMAIL_SMTP_PORT == 465,
        auth: {
            user: process.env.GMAIL_SMTP_USERNAME,
            pass: process.env.GMAIL_APP_PASSWORD,
        }
    });

    const mail = {
        from: `Task Manager: ${process.env.GMAIL_USERNAME}`,
        to: options.email,
        subject: options.subject,
        text: textEmail,
        html: htmlEmail,
    }

    try{
        await transporter.sendMail(mail);
        console.log("email sent successfully");
    }catch(error){
        console.error("email service failed with error: ", error);
    }
}


// ---- AUTH MAIL FORMATS ----
const emailVerificationMailGenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: `Welcome to this app made by Nawaz , We are excited to have you on board`,
            action: {
                instructions: `to verify your email, please click the following button:`,
                button: {
                    color: `#22BC66`,
                    text: `Verify your email`,
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have questions? just reply to this email, we'd love to help.",
        }
    };
};
const loginVerificationMailGenContent = (username, logoutUrl) => {
    return {
        body: {
            name: username,
            intro: `Welcome back , We are excited to have you on board, a login to your account was just made.`,
            action: {
                instructions: `if you did not login and want to Logout, please click the following button:`,
                button: {
                    color: `#FF2A04`,
                    text: `Logout`,
                    link: logoutUrl,
                },
            },
            outro: "Need help, or have questions? just reply to this email, we'd love to help.",
        }
    };
};

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: `We received a request to reset your password.`,
            action: {
                instructions: `to reset your password, click on the following button:`,
                button: {
                    color: `#DC4D2F`,
                    text: `Reset Password`,
                    link: passwordResetUrl,
                },
            },
            outro: "Need help, or have questions? just reply to this email, we'd love to help.",
        }
    };
};


//----USER MAIL FORMATS ----
const emailChangedMailGenContent = (username, passwordResetUrl, newEmail) => {
    return {
        body: {
            name: username,
            intro: `We received a request to change your email, `,
            action: {
                instructions: `if you did not ask for email change, click the button belwo to reset your password`,
                button: {
                    color: `#DC4D2F`,
                    text: `Reset Password`,
                    link: passwordResetUrl,
                },
            },
            outro: "Need help, or have questions? just reply to this email, we'd love to help.",
        }
    };
}
const accountDeletionMailGenContent = (username) => ({
    body: {
        name: username,
        intro: `Your account has been successfully deleted.`,
        outro: "We’re sorry to see you go. If you have any feedback or need assistance, feel free to reach out.",
    }
});


export {
    sendEmail,

    emailVerificationMailGenContent,
    loginVerificationMailGenContent,
    forgotPasswordMailGenContent,

    emailChangedMailGenContent,
    accountDeletionMailGenContent
};

