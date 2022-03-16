const express = require("express");
const app = express();
const port = 3000;
const crypto = require("crypto");
const uuid = require("uuid");

require("dotenv").config();

const generateEmbedUrlForSigma = ({
  embedSecret,
  embedPath,
  allowExport = true,
  sessionLength = 3600,
  externalUserId = "none",
}) => {
  if (!embedSecret) {
    throw new AppError("Missing embedSecret");
  }
  if (!embedPath) {
    throw new AppError("Missing embedPath");
  }
  const nonce = uuid.v4();
  const timestamp = Math.floor(new Date().getTime() / 1000);
  // `Control Id` is the Control Id from your dashboard and `controlValue` is the value you wish to pass
  // const controlId = encodeURIComponent('Control ID')
  // const controlValue = encodeUIRComponent('Control Value')
  let url = `${embedPath}?:nonce=${nonce}&:allow_export=${allowExport}&:time=${timestamp}&:session_length=${sessionLength}&:external_user_id=${externalUserId}`;
  const signature = crypto
    .createHmac("sha256", Buffer.from(embedSecret, "utf8"))
    .update(Buffer.from(url, "utf8"))
    .digest("hex");
  url = `${url}&:signature=${signature}`;
  return url;
};

app.get("/", (req, res) => {
  const embedUrl = generateEmbedUrlForSigma({
    embedSecret: process.env.DASHBOARD_EMBED_SECRET,
    embedPath: process.env.DASHBOARD_EMBED_PATH,
  });
  // // :nonce - Any random string you like but cannot be repeated within the hour.
  // let searchParams = `?:nonce=${uuid.v4()}`;

  // // :allow_export - true to allow export/download on visualizations
  // searchParams += "&:allow_export=true";

  // // :session_length - The number of seconds the user should be allowed to view the embed
  // searchParams += "&:session_length=3600";

  // // :time - Current Time as UNIX Timestamp
  // searchParams += `&:time=${Math.floor(new Date().getTime() / 1000)}`;

  // // :external_user_id - a unique JSON string identifying the viewer
  // searchParams += `&:external_user_id=${USER_ID}`;

  // // `Control Id` is the Control Id from your dashboard and `controlValue` is the value you wish to pass
  // // searchParams += `&${encodeURIComponent("Control Id")}=${encodeURIComponent(
  // //   controlValue
  // // )}`;

  // // EMBED_PATH - Generated on your dashboard
  // const URL_WITH_SEARCH_PARAMS =
  //   process.env.DASHBOARD_EMBED_PATH + searchParams;

  // // EMBED_SECRET - Sigma Embed Secret generated in your admin portal
  // const SIGNATURE = crypto
  //   .createHmac(
  //     "sha256",
  //     Buffer.from(process.env.DASHBOARD_EMBED_SECRET, "utf8")
  //   )
  //   .update(Buffer.from(URL_WITH_SEARCH_PARAMS, "utf8"))
  //   .digest("hex");

  // const embedUrl = `${URL_WITH_SEARCH_PARAMS}&:signature=${SIGNATURE}`;

  // res.status(200).send(embedUrl);
  res.send(`<html>
    <h1>Dashboard Embed Example</h1>
    <h3>${embedUrl}</h3>
    <iframe src="${embedUrl}" style="width: 100%; height: 100%;" />
  </html>`);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
