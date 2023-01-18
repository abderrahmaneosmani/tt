// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "chrome-aws-lambda";
import playwright from "playwright-core";
type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const browser = await playwright.chromium.launch({
      args: [...chromium.args, "--font-render-hinting=none"], // This way fix rendering issues with specific fonts
      executablePath:
        process.env.NODE_ENV === "production"
          ? await chromium.executablePath
          : "/usr/local/bin/chromium",
      headless:
        process.env.NODE_ENV === "production" ? chromium.headless : true,
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    // This is the path of the url which shall be converted to a pdf file
    const pdfUrl =
      process.env.NODE_ENV === "production"
        ? "https://your.app/pdf"
        : "http://localhost:3000/pdf";

    await page.goto(pdfUrl, {
      waitUntil: "load",
    });

    const pdf = await page.pdf({
      path: "/tmp/awesome.pdf", // we need to move the pdf to the tmp folder otherwise it won't work properly
      printBackground: true,
      format: "a4",
    });
    await browser.close();

    return res.status(200).json({ pdf });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}
