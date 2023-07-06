import { CompanyReportData } from "./types";
import { PieChart } from "react-minimal-pie-chart";

type ReportProps = {
  data: CompanyReportData;
};

export const Report = ({ data }: ReportProps) => {
  const officesPerCountry = data.company.offices.reduce((r, a) => {
    r[a.country] = r[a.country] || [];
    r[a.country].push(a);
    return r;
  }, Object.create(null));

  const colors = [
    "#FFC107",
    "#FF9800",
    "#FF5722",
    "#795548",
    "#607D8B",
    "#9C27B0",
  ];

  const categoryPerSubsidiary = data.subsidiaries.reduce((r, a) => {
    if (a.category === null) {
      a.category = "Unknown";
    }
    r[a.category] = r[a.category] || [];
    r[a.category].push(a);
    return r;
  }, Object.create(null));

  const pieChartData = Object.keys(officesPerCountry).map((country, index) => {
    return {
      title: country === "null" ? "Other" : country,
      value: officesPerCountry[country].length,
      color: colors[index],
    };
  });

  const pieChartSubsidiaryData = Object.keys(categoryPerSubsidiary).map(
    (category, index) => {
      return {
        title: category === "null" ? "Unknown" : category,
        value: categoryPerSubsidiary[category].length,
        color: colors[index],
      };
    }
  );

  function numberWithCommas(s: string) {
    return s.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return (
    <div className="w-[280mm] bg-palette-neutral-bg-weak flex flex-col gap-2 p-8 rounded-2xl shadow-lg">
      <div className="">
        <h3 className="font-bold n-h2">{data.company.name}</h3>
        <p className="font-medium">{data.company.summary}</p>
      </div>
      <p className="">Industry: {data.company.industry}</p>
      <p className="">CEO: {data.company.ceo}</p>
      <div className="flex flex-row">
        <div className="mx-auto bg-transparent stats">
          <div className="stat text-palette-neutral-text-inverse">
            <div className="stat-figure text-palette-success-text">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="n-w-7 n-h-7 text-palette-success-text"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                ></path>
              </svg>
            </div>
            <div className="stat-title">Revenue</div>
            <div className="stat-value text-palette-neutral-text-default ">
              {data.company.revenue
                ? numberWithCommas(data.company.revenue)
                : "Unknown"}
            </div>
          </div>

          <div className="stat">
            <div className="stat-figure">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="n-w-7 n-h-7 text-palette-primary-text"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                ></path>
              </svg>
            </div>
            <div className="stat-title">Suppliers</div>
            <div className="stat-value text-palette-neutral-text-default">
              {data.suppliers.length}
            </div>
          </div>

          <div className="stat">
            <div className="stat-figure">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="n-w-7 n-h-7 text-mint-50"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
                ></path>
              </svg>
            </div>
            <div className="stat-title">Subsidiaries</div>
            <div className="stat-value text-palette-neutral-text-default">
              {data.subsidiaries.length}
            </div>
          </div>
          <div className="stat">
            <div className="stat-figure">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="n-w-7 n-h-7 n-text-blueberry-50"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                ></path>
              </svg>
            </div>
            <div className="stat-title">Employees</div>
            <div className="stat-value text-palette-neutral-text-default">
              {data.company.nbrEmployees ?? "Unknown"}
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <h3 className="n-h3">News</h3>
        <p>{data.articleSummary}</p>
      </div>
      <div className="flex flex-row mx-auto">
        <div>
          <h3 className="text-center n-h5 ">Location of offices</h3>
          <PieChart
            className="w-[400px] h-[400px]"
            radius={45}
            viewBoxSize={[100, 100]}
            labelStyle={{
              fontSize: "4px",
            }}
            data={pieChartData}
            label={({ dataEntry }) => dataEntry.title}
          />
        </div>
        <div className="">
          <h3 className="text-center n-h5">Category of subsidiaries</h3>
          <PieChart
            className="w-[400px] h-[400px]"
            radius={45}
            viewBoxSize={[100, 100]}
            labelStyle={{
              fontSize: "4px",
            }}
            data={pieChartSubsidiaryData}
            label={({ dataEntry }) => dataEntry.title}
          />
        </div>
      </div>

      <div className="">
        {data.subsidiaries.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-palette-neutral-text-default">
              Subsidiaries
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {data.subsidiaries.map((subsidiary) => (
                <>
                  <div
                    key={subsidiary.name}
                    className="overflow-hidden bg-white rounded-lg shadow"
                  >
                    <div className="flex-row px-4 py-5">
                      <div>
                        <p className="text-sm font-medium truncate text-palette-neutral-text-default">
                          {subsidiary.name}
                        </p>
                        <p className="mt-1 text-sm text-palette-neutral-text-default">
                          {subsidiary.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">News</h4>
                    <p className="mt-1 text-sm text-palette-neutral-text-default">
                      {subsidiary.articleSummary}
                    </p>
                  </div>
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
