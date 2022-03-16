const express = require("express");
const crypto = require("crypto");
const uuid = require("uuid");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;

DEFAULT_CONTROLS = { organization: "10b2b63a-2217-45b5-a0fc-2050f385bf83" };

const generateEmbedUrlForSigma = ({
  embedSecret,
  embedPath,
  allowExport = true,
  sessionLength = 3600,
  externalUserId = "none",
  controls = {}, // a hash map of controlId: controlValue
}) => {
  if (!embedSecret) {
    throw new AppError("Missing embedSecret");
  }
  if (!embedPath) {
    throw new AppError("Missing embedPath");
  }
  const nonce = uuid.v4();
  const timestamp = Math.floor(new Date().getTime() / 1000);
  let url = `${embedPath}?:nonce=${nonce}&:allow_export=${allowExport}&:time=${timestamp}&:session_length=${sessionLength}&:external_user_id=${externalUserId}&${joinControls(
    controls
  )}`;
  const signature = crypto
    .createHmac("sha256", Buffer.from(embedSecret, "utf8"))
    .update(Buffer.from(url, "utf8"))
    .digest("hex");
  url = `${url}&:signature=${signature}`;
  return url;
};

const joinControls = (controls = {}) => {
  if (Object.keys(controls).length === 0) {
    return "";
  }
  url_fragments = [];
  for (const controlId in controls) {
    if (controls.hasOwnProperty(controlId)) {
      url_fragments.push(
        `${encodeURIComponent(controlId)}=${encodeURIComponent(
          controls[controlId]
        )}`
      );
    }
  }
  return url_fragments.join("&");
};

const controlFormElement = (controlId, controlValue) => `
  <div id="control-${controlId}">
    <label><strong>${controlId}</strong></label><br />
    <input type="text" name="${controlId}" id="${controlId}" value="${controlValue}" />
    <button type="button" onClick="const elm = document.getElementById('control-${controlId}'); elm.parentNode.removeChild(elm)">Remove</button>
  </div>
`;
const pageTemplate = ({ embedUrl = "", controls = {} } = {}) => {
  const controlsFormElements = [];
  for (const controlId in controls) {
    controlsFormElements.push(
      controlFormElement(controlId, controls[controlId])
    );
  }
  return `<html>
  <head>
    <link rel="stylesheet" href="https://unpkg.com/simpledotcss/simple.min.css">
    <style>body {grid-template-columns: 1fr min(60rem,90%) 1fr !important;}</style>
    <script>
      const controlFormElement = (controlId, controlValue) => \`
        <div id="control-$\{controlId\}">
          <label><strong>$\{controlId\}</strong></label><br />
          <input type="text" name="$\{controlId\}" id="$\{controlId\}" value="$\{controlValue\}" />
          <button type="button" onClick="const elm = document.getElementById('control-$\{controlId\}'); elm.parentNode.removeChild(elm)">Remove</button>
        </div>
      \`;
      const addControl = controlId => {
        const elm = document.getElementById('new-control'); 
        const newControlElm = htmlToElem(controlFormElement(elm.value, ''));
        document.getElementById('controls').appendChild(newControlElm);
        elm.value = '';
      }
      const htmlToElem = (html) => {
        let temp = document.createElement('template');
        html = html.trim(); // Never return a space text node as a result
        temp.innerHTML = html;
        return temp.content.firstChild;
      }
    </script>
  </head>
  <body>
    <h1>Dashboard Embed Example</h1>
    <h3>Controls</h3>
    <form>
    <input type="text" placeholder="add controls by typing control ID here" id="new-control" />
    <button type="button" onClick="addControl()">Add control</button>
    </form>
    <form action="/" method="post"> 
      <div id="controls">
        ${controlsFormElements.join("")}
      </div>
      <button type="submit">Generate Embed</button>
    </form>
    ${embedUrl && embedSection(embedUrl)}
  </body>
</html>`;
};
const embedSection = (embedUrl) => {
  return `<h4>Embed URL</h4>
  <div>
    ${embedUrl}
  </div>
  <h4>Embedded Dashboard</h4>
  <iframe src="${embedUrl}" style="width: 1200px; height: 600px;" />
  `;
};

app.get("/", (req, res) => {
  res.send(pageTemplate({ controls: DEFAULT_CONTROLS }));
});
app.post("/", (req, res) => {
  const controls = req.body;
  const embedUrl = generateEmbedUrlForSigma({
    embedSecret: process.env.DASHBOARD_EMBED_SECRET,
    embedPath: process.env.DASHBOARD_EMBED_PATH,
    controls,
  });
  res.send(pageTemplate({ embedUrl, controls }));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
