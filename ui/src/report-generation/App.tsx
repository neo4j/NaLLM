import "@neo4j-ndl/base/lib/neo4j-ds-styles.css";
import { useState, useEffect, ChangeEvent } from "react";
import { Switch } from "../components/switch";
import KeyModal from "../components/keymodal";
import { getReportData } from "./utils/fetch-report";
import { CompanyReportData } from "./types";
import { Report } from "./Report";
import { getCompanies } from "./utils/fetch-example-companies";

const HAS_API_KEY_URI =
  import.meta.env.VITE_HAS_API_KEY_ENDPOINT ??
  "http://localhost:7860/hasapikey";

function loadKeyFromStorage() {
  return localStorage.getItem("api_key");
}

function App() {
  const [serverAvailable, setServerAvailable] = useState(true);
  const [needsApiKeyLoading, setNeedsApiKeyLoading] = useState(true);
  const [needsApiKey, setNeedsApiKey] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(loadKeyFromStorage() || "");

  const [companyData, setCompanyData] = useState<CompanyReportData | undefined>(
    undefined
  );
  const [loadingCompanyData, setLoadingCompanyData] = useState(false);
  const [typedCompanyName, setTypedCompanyName] = useState("");
  const [possibleCompaniesToSelect, setPossibleCompaniesToSelect] = useState(
    [] as string[]
  );

  const initDone = serverAvailable && !needsApiKeyLoading;

  useEffect(() => {
    getCompanies().then((companies) => {
      if (companies) {
        setPossibleCompaniesToSelect(companies);
      }
    });
  }, []);

  useEffect(() => {
    fetch(HAS_API_KEY_URI).then(
      (response) => {
        response.json().then(
          (result) => {
            // const needsKey = result.output;
            const needsKey = !result.output;
            setNeedsApiKey(needsKey);
            setNeedsApiKeyLoading(false);
            if (needsKey) {
              const api_key = loadKeyFromStorage();
              if (api_key) {
                setApiKey(api_key);
              } else {
                setModalIsOpen(true);
              }
            }
          },
          (error) => {
            setNeedsApiKeyLoading(false);
            setServerAvailable(false);
          }
        );
      },
      (error) => {
        setNeedsApiKeyLoading(false);
        setServerAvailable(false);
      }
    );
  }, []);

  const openModal = () => {
    setModalIsOpen(true);
  };

  const onCloseModal = () => {
    setModalIsOpen(false);
  };

  const onApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem("api_key", newApiKey);
  };

  const changeSelectedCompany = async (company: string) => {
    setLoadingCompanyData(true);
    const key = apiKey === "" ? undefined : apiKey;

    const data = await getReportData(company, key);
    setLoadingCompanyData(false);
    console.log(data);
    if (data) {
      setCompanyData(data);
    } else {
      console.log("No data");
    }
  };

  if (serverAvailable) {
    return (
      <div className="min-h-screen n-bg-palette-neutral-bg-default">
        {needsApiKey && (
          <div className="flex justify-end mr-4">
            <button onClick={openModal}>API Key</button>
          </div>
        )}
        <KeyModal
          isOpen={initDone && needsApiKey && modalIsOpen}
          onCloseModal={onCloseModal}
          onApiKeyChanged={onApiKeyChange}
          apiKey={apiKey}
        />
        <main className="flex flex-col gap-10 p-2">
          <div className="mx-auto mt-2 shadow-xl card w-[900px] bg-base-100">
            <div className="card-body">
              <h2 className="card-title">Report generator</h2>
              <p>
                In this demo you can select a company to be used to generator a
                report. The report contains the current information about the
                company from the database as well as a summary of the news
                articles from the database that mention the company{" "}
              </p>
              <div className="w-full form-control">
                <label className="label">
                  <span className="label-text">
                    Pick a company to generate a report for
                  </span>
                </label>
                <div className="flex flex-row gap-2">
                  {possibleCompaniesToSelect.map((company) => (
                    <button
                      key={company}
                      onClick={() => changeSelectedCompany(company)}
                      className={`ndl-btn ndl-medium ndl-filled ndl-primary n-bg-palette-primary-bg-strong ${
                        loadingCompanyData && "ndl-disabled"
                      }`}
                      disabled={loadingCompanyData}
                    >
                      {company}
                    </button>
                  ))}
                </div>
                <span className="my-2 label-text">Or type a company name</span>
                <div className="flex flex-row gap-4">
                  <input
                    type="text"
                    className="input input-bordered"
                    value={typedCompanyName}
                    onChange={(e) => setTypedCompanyName(e.target.value)}
                  />
                  <button
                    className={`ndl-btn ndl-large ndl-filled ndl-primary n-bg-palette-primary-bg-strong ${
                      loadingCompanyData && "ndl-disabled"
                    }`}
                    disabled={loadingCompanyData}
                    onClick={() => changeSelectedCompany(typedCompanyName)}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loadingCompanyData && (
            <div className="mx-auto">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}
          <div className="self-center">
            {companyData && !loadingCompanyData && (
              <Report data={companyData} />
            )}
          </div>
        </main>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen n-bg-palette-neutral-bg-default">
        <main className="flex flex-col gap-10 p-2">
          <div className="flex flex-col w-2/3 min-h-0 gap-2 mx-auto mt-10"></div>
        </main>
      </div>
    );
  }
}

export default App;
