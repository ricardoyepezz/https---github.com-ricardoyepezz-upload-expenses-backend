const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS); // Parsea la cadena JSON de las credenciales

const storage = new Storage({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key.replace(/\\n/g, '\n') // Corrige los escapes de nuevas líneas
  }
});
const bucket = storage.bucket('tu-bucket-name');

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  blobStream.on('error', err => res.status(500).send(err.toString()));
  blobStream.on('finish', () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    res.status(200).send({ url: publicUrl });
  });

  blobStream.end(req.file.buffer);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
