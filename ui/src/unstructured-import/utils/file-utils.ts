import JSZip from "jszip";
import { saveAs } from "file-saver";

const regex = /```([\w\W]*?)\n([\w\W]*?)```/g;

export const saveImportResult = (importResult: string) => {
  const files = [...importResult.matchAll(regex)];

  const zip = new JSZip();
  files.forEach((regexMatch, index) => {
    const fileName = regexMatch[1];
    const file = regexMatch[2];

    const fileNameEnding = fileName.split(".").pop();
    if (fileNameEnding === "json") {
      zip.file("neo4j_importer_model.json", file);
    } else {
      zip.file(`${fileName}`, file);
    }
  });

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, "import.zip");
  });
};
