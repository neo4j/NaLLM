export type CompanyReportData = {
  company: {
    name: string;
    summary: string | null;
    isDissolved: string | null;
    revenue: string | null;
    isPublic: string | null;
    nbrEmployees: string | null;
    motto: string | null;
    industry: string | null;
    category: string | null;
    ceo: string | null;
    offices: {
      city: string;
      country: string;
    }[];
  };
  subsidiaries: {
    name: string;
    summary: string | null;
    isDissolved: string | null;
    revenue: string | null;
    isPublic: string | null;
    category: string | null;
    articleSummary: string | null;
  }[];
  suppliers: {
    name: string;
    summary: string | null;
    isDissolved: string | null;
    revenue: string | null;
    isPublic: string | null;
    category: string | null;
    articleSummary: string | null;
  }[];
  articleSummary: string;
};
