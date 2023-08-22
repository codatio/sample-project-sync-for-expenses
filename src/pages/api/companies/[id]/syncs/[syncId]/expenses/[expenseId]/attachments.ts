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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { syncId, id: companyId, expenseId } = req.query;
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const form = new IncomingForm({
    keepExtensions: true,
  });

  try {
    const [, files] = await form.parse(req);
    const filesByName = files[Object.keys(files)[0]] as formidable.File[];
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filesByName[0].filepath));

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
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid request" });
    return;
  }
}
