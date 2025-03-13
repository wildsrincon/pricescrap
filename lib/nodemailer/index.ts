"use server";

import { EmailContent, EmailProductInfo, NotificationType } from "@/types";
import { SendMailOptions, createTransport } from "nodemailer";

const Notification = {
  WELCOME: "WELCOME",
  CHANGE_OF_STOCK: "CHANGE_OF_STOCK",
  LOWEST_PRICE: "LOWEST_PRICE",
  THRESHOLD_MET: "THRESHOLD_MET",
};

export async function generateEmailBody(
  product: EmailProductInfo,
  type: NotificationType
) {
  const THRESHOLD_PERCENTAGE = 40;
  // Shorten the product title
  const shortenedTitle =
    product.title.length > 20
      ? `${product.title.substring(0, 20)}...`
      : product.title;

  let subject = "";
  let body = "";

  switch (type) {
    case Notification.WELCOME:
      subject = `Welcome to Price Tracking for ${shortenedTitle}`;
      body = `
        <div>
          <h2>Welcome to PriceWise 🚀</h2>
          <p>You are now tracking ${product.title}.</p>
          <p>Here's an example of how you'll receive updates:</p>
          <div style="border: 1px solid #ccc; padding: 10px; background-color: #f8f8f8;">
            <h3>${product.title} is back in stock!</h3>
            <p>We're excited to let you know that ${product.title} is now back in stock.</p>
            <p>Don't miss out - <a href="${product.url}" target="_blank" rel="noopener noreferrer">buy it now</a>!</p>
            <img src="https://i.ibb.co/pwFBRMC/Screenshot-2023-09-26-at-1-47-50-AM.png" alt="Product Image" style="max-width: 100%;" />
          </div>
          <p>Stay tuned for more updates on ${product.title} and other products you're tracking.</p>
        </div>
      `;
      break;

    case Notification.CHANGE_OF_STOCK:
      subject = `${shortenedTitle} is now back in stock!`;
      body = `
        <div>
          <h4>Hey, ${product.title} is now restocked! Grab yours before they run out again!</h4>
          <p>See the product <a href="${product.url}" target="_blank" rel="noopener noreferrer">here</a>.</p>
        </div>
      `;
      break;

    case Notification.LOWEST_PRICE:
      subject = `Lowest Price Alert for ${shortenedTitle}`;
      body = `
        <div>
          <h4>Hey, ${product.title} has reached its lowest price ever!!</h4>
          <p>Grab the product <a href="${product.url}" target="_blank" rel="noopener noreferrer">here</a> now.</p>
        </div>
      `;
      break;

    case Notification.THRESHOLD_MET:
      subject = `Discount Alert for ${shortenedTitle}`;
      body = `
        <div>
          <h4>Hey, ${product.title} is now available at a discount more than ${THRESHOLD_PERCENTAGE}%!</h4>
          <p>Grab it right away from <a href="${product.url}" target="_blank" rel="noopener noreferrer">here</a>.</p>
        </div>
      `;
      break;

    default:
      throw new Error("Invalid notification type.");
  }

  return { subject, body };
}

// Función para crear transportador con configuración segura
const createSecureTransporter = () => {
  return createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: "wildsrincon@hotmail.com",
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: "TLSv1.2", // Actualizado de SSLv3 a TLSv1.2
      rejectUnauthorized: true, // Cambiado a true para mayor seguridad
    },
  });
};

export const sendEmail = async (
  emailContent: EmailContent,
  sendTo: string[]
) => {
  // Verificar que los parámetros no estén vacíos
  if (!emailContent || !sendTo || sendTo.length === 0) {
    throw new Error("Parámetros de correo inválidos");
  }

  const transporter = createSecureTransporter();

  const mailOptions: SendMailOptions = {
    from: {
      name: "PriceWise Tracking",
      address: "wildsrincon@hotmail.com",
    },
    to: sendTo,
    subject: emailContent.subject,
    html: emailContent.body,
    // Añadir texto plano como respaldo
    text: emailContent.body.replace(/<[^>]*>?/gm, ""),
  };

  try {
    // Verificar transportador antes de enviar
    await new Promise((resolve, reject) => {
      transporter.verify((error: Error | null) => {
        if (error) {
          console.error("Error de verificación del transportador:", error);
          reject(error);
        } else {
          resolve(true);
        }
      });
    });

    // Enviar correo
    const info = await transporter.sendMail(mailOptions);

    console.log("Correo enviado con éxito:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return info;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error detallado al enviar correo:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    } else {
      console.error("Error desconocido:", error);
    }

    // Manejo de errores específicos
    if ((error as any).code === "ETIMEDOUT") {
      console.error("Tiempo de conexión agotado");
    }

    throw error;
  }
};
