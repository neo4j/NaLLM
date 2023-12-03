import { CompanyReportData } from "../types";

type JSONResponse = {
  output?: string[];
  errors?: Array<{ message: string }>;
};

export const getCompanies = async () => {
  const LIST_EXAMPLE_COMPANIES_URI =
      import.meta.env.VITE_REPORT_COMPANY_LIST_ENDPOINT ??
      "http://localhost:7860/companyReport/list";

  const response = await fetch(LIST_EXAMPLE_COMPANIES_URI,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    return Promise.reject(
      new Error(`Failed to get company: ${response.statusText}`)
    );
  }
  const { output, errors }: JSONResponse = await response.json();

  if (errors !== undefined) {
    const error = new Error(
      errors?.map((e) => e.message).join("\n") ?? "unknown"
    );
    return Promise.reject(error);
  }
  console.log("data", output);
  return output ?? undefined;
};
