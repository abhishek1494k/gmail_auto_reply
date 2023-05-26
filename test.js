const fs = require("fs");
const express = require("express");
const app = express();
const { google } = require("googleapis");

require("dotenv").config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.client_id,
  process.env.client_secret,
  process.env.redirect_uris
);

oAuth2Client.setCredentials({ refresh_token: process.env.refresh_token });

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

// ---->>>>> Fetch and Reply <<<<<-----
async function fetchAndReplyToEmails() {
  let repliedThreads = [];
  try {
    repliedThreads = JSON.parse(fs.readFileSync("repliedThreads.json", "utf8"));
  } catch (error) {
    console.log(error);
  }

  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread label:INBOX",
    });

    const messages = response.data.messages;

    if (messages && messages.length > 0) {
      console.log("Found unread emails. Replying...");

      let newLabel;
      if (!labelExists()) {
        try {
          newLabel = await gmail.users.labels.create({
            userId: "me",
            requestBody: {
              name: "Replied",
            },
          });
          console.log("New Lable Created");
        } catch (error) {
          console.log("New Label not created", error);
        }
      } else {
        newLabel = await labelExists();
      }

      console.log(newLabel);

      for (const message of messages) {
        const email = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });

        const threadId = email.data.threadId;
        if (repliedThreads.includes(threadId)) {
          console.log(
            `Thread with ID ${threadId} has already been replied to. Skipping...`
          );
          continue;
        }

        const replyMessage = createReplyMessage(email.data);
        const encodedMessage = Buffer.from(replyMessage).toString("base64");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
            threadId,
          },
        });
        console.log(`Replied to email with thread ID: ${threadId}`);

        repliedThreads.push(threadId);
        console.log(
          `Added thread with ID ${threadId} to the replied threads list.`
        );

        await gmail.users.messages.modify({
          userId: "me",
          id: message.id,
          requestBody: {
            addLabelIds: [newLabel.id || newLabel.data.id],
          },
        });
        console.log(`Added label to email with ID: ${message.id}`);
      }
    } else {
      console.log("No unread emails found.");
    }

    fs.writeFileSync(
      "repliedThreads.json",
      JSON.stringify(repliedThreads),
      "utf8"
    );
  } catch (err) {
    console.log(err);
  }
}

// ---->>>>> Check Whether label Exist <<<<<-----
async function labelExists(labelName = "Replied") {
  const res = await gmail.users.labels.list({ userId: "me" });
  let labels = res.data.labels;
  for (let label of labels) {
    if (label.name === labelName) {
      return label;
    }
  }
  return false;
}

function getHeaderValue(headers, name) {
  const header = headers.find(
    (header) => header.name.toLowerCase() === name.toLowerCase()
  );
  return header ? header.value : "";
}

function createReplyMessage(email) {

  const headers = email.payload.headers;
  const subject = getHeaderValue(headers, "Subject");
  const sender = getHeaderValue(headers, "From");

  const body = `Dear ${sender},
  
  Thank you for your email with the subject "${subject}". 
  This is an automated reply to acknowledge that we have received your message.
  
  Best regards,
  Your Name`;

  return `To: ${sender}\nSubject: ${subject}\nContent-Type: text/plain; charset="UTF-8"\nContent-Transfer-Encoding: base64\n\n${Buffer.from(
    body
  ).toString("base64")}`;
}

// >>>> Interval between 45 to 120 seconds <<<<<
const interval = Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000;

// >>>> Call the fetchAndReplyToEmails function initially <<<<
fetchAndReplyToEmails().catch(console.error);

// >>>> Schedule the next executions at regular intervals <<<<
setInterval(fetchAndReplyToEmails, interval);
