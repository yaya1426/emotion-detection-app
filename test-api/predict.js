import "dotenv/config";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const DEFAULT_URL =
  "https://predict-69d7c601623f4574626f-dproatj77a-oc.a.run.app/predict";
const DEFAULT_CONF = "0.25";
const DEFAULT_IOU = "0.7";
const DEFAULT_IMGSZ = "640";
const DEFAULT_IMAGES_DIR = "./images";
const DEFAULT_RESULTS_DIR = "./results";
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function printUsage() {
  console.error(
    [
      "Usage:",
      "  npm run predict -- --dir ./images",
      "  npm run predict -- --image ./images/your-image.jpg",
      "",
      "Optional flags:",
      "  --dir <images_folder>",
      "  --outDir <results_folder>",
      "  --url <deployment_url>",
      "  --conf <0-1>",
      "  --iou <0-1>",
      "  --imgsz <integer>",
    ].join("\n")
  );
}

async function predictImage({ imagePath, apiKey, url, conf, iou, imgsz }) {
  const fileBytes = await readFile(imagePath);
  const fileName = basename(imagePath);
  const fileBlob = new Blob([fileBytes]);

  const form = new FormData();
  form.append("file", fileBlob, fileName);
  form.append("conf", conf);
  form.append("iou", iou);
  form.append("imgsz", imgsz);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(
      `Request failed for ${fileName}: ${response.status} ${response.statusText}\n${JSON.stringify(
        body,
        null,
        2
      )}`
    );
  }

  return body;
}

async function getImagesFromDir(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const imagePaths = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()))
    .map((entry) => join(directoryPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
  return imagePaths;
}

function extractTopPrediction(predictionResponse) {
  const firstImage = predictionResponse?.images?.[0];
  const firstResult = firstImage?.results?.[0];
  if (!firstResult) return null;
  return {
    name: firstResult.name ?? null,
    class: firstResult.class ?? null,
    confidence: firstResult.confidence ?? null,
  };
}

async function main() {
  const imagePath = getArgValue("--image");
  const imagesDir = getArgValue("--dir") ?? DEFAULT_IMAGES_DIR;
  const outDir = getArgValue("--outDir") ?? DEFAULT_RESULTS_DIR;
  const apiKey = process.env.ULTRALYTICS_API_KEY;
  const url = getArgValue("--url") ?? process.env.ULTRALYTICS_URL ?? DEFAULT_URL;
  const conf = getArgValue("--conf") ?? DEFAULT_CONF;
  const iou = getArgValue("--iou") ?? DEFAULT_IOU;
  const imgsz = getArgValue("--imgsz") ?? DEFAULT_IMGSZ;

  if (!apiKey) {
    console.error("Missing ULTRALYTICS_API_KEY environment variable.");
    printUsage();
    process.exit(1);
  }

  let imagePaths = [];
  if (imagePath) {
    imagePaths = [imagePath];
  } else {
    imagePaths = await getImagesFromDir(imagesDir);
  }

  if (imagePaths.length === 0) {
    console.error(
      `No image files found. Add images to ${imagesDir} or pass --image <path>.`
    );
    printUsage();
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  const runResults = [];
  for (const currentImagePath of imagePaths) {
    const fileName = basename(currentImagePath);
    console.log(`Processing ${fileName}...`);
    try {
      const prediction = await predictImage({
        imagePath: currentImagePath,
        apiKey,
        url,
        conf,
        iou,
        imgsz,
      });
      const outputPath = join(outDir, `${fileName}.json`);
      await writeFile(outputPath, JSON.stringify(prediction, null, 2), "utf8");
      const top = extractTopPrediction(prediction);
      runResults.push({
        image: fileName,
        prediction: top?.name ?? "No prediction",
      });
      console.log(`Saved ${outputPath}`);
    } catch (error) {
      runResults.push({
        image: fileName,
        prediction: "Failed",
      });
      console.error(`Failed ${fileName}:`);
      console.error(error);
    }
  }

  const summaryPath = join(outDir, "summary.json");
  await writeFile(summaryPath, JSON.stringify(runResults, null, 2), "utf8");
  console.log(`Saved ${summaryPath}`);

  const failedCount = runResults.filter(
    (item) => item.prediction === "Failed"
  ).length;
  const successCount = runResults.length - failedCount;
  console.log(`Done. ${successCount} succeeded, ${failedCount} failed.`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
