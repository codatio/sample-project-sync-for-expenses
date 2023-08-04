import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import FormData from "form-data";
import formidable, { IncomingForm } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { syncId, id: companyId, expenseId } = req.query;
  if (req.method === "POST") {
    const form = new IncomingForm({
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(400).json({ error: "Invalid request" });
        return;
      }

      const uploadedFiles = files[Object.keys(files)[0]] as formidable.File[];
      const formData = new FormData();
      formData.append("file", fs.createReadStream(uploadedFiles[0].filepath));

      try {
        await axios.post(
          `https://api.codat.io/companies/${companyId}/sync/expenses/syncs/${syncId}/transactions/${expenseId}/attachments`,
          formData,
          {
            headers: {
              Authorization: process.env.CODAT_AUTH_HEADER,
              ...formData.getHeaders(),
            },
          }
        );

        res.status(200).end();
        return;
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error uploading file" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
