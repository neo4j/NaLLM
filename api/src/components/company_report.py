from components.base_component import BaseComponent
from components.summarize_cypher_result import SummarizeCypherResult
from driver.neo4j import Neo4jDatabase
from llm.basellm import BaseLLM

HARD_LIMIT_CONTEXT_RECORDS = 10


class CompanyReport(BaseComponent):
    def __init__(
        self,
        database: Neo4jDatabase,
        company: str,
        llm: BaseLLM,
    ) -> None:
        self.database = database
        self.company = company
        self.llm = llm

    def run(self):
        summarize_results = SummarizeCypherResult(
            llm=self.llm,
        )
        print("CompanyReport")
        company_data = self.database.query(
            "MATCH (n {name:$companyName}) return n.summary, n.isDissolved, n.nbrEmployees, n.name, n.motto, n.isPublic, n.revenue",
            {"companyName": self.company},
        )
        print(company_data)
        relation_data = self.database.query(
            "MATCH (n {name:$companyName})-[r]->(m) WHERE NOT m:Article OPTIONAL MATCH (m)-[:IN_COUNTRY]->(c:Country) WITH r,m,c return r,m,c",
            {"companyName": self.company},
        )
        print(relation_data)
        company_data_output = {
            "name": company_data[0]["n.name"],
            "motto": company_data[0]["n.motto"],
            "summary": company_data[0]["n.summary"],
            "isDissolved": company_data[0]["n.isDissolved"],
            "nbrEmployees": company_data[0]["n.nbrEmployees"],
            "isPublic": company_data[0]["n.isPublic"],
            "revenue": company_data[0].get("n.revenue", None),
        }
        print(company_data_output)
        print("all data fetched")
        offices = []
        suppliers = []
        subsidiaries = []
        for relation in relation_data:
            print(relation)
            relation_type = relation["r"][1]
            if relation_type == "IN_CITY":
                offices.append(
                    {
                        "city": relation["m"].get("name", None),
                        "country": relation.get("c")
                        and relation["c"].get("name", None),
                    }
                )
            elif relation_type == "HAS_CATEGORY":
                company_data_output["industry"] = relation["m"]["name"]
            elif relation_type == "HAS_SUPPLIER":
                category_result = self.database.query(
                    "MATCH (n {name:$companyName})-[HAS_CATEGORY]-(c:IndustryCategory) return c.name LIMIT 1",
                    {"companyName": relation["m"].get("name", None)},
                )
                category = None
                if len(category_result) > 0:
                    category = category_result[0]["c.name"]

                suppliers.append(
                    {
                        "summary": relation["m"].get("summary", None),
                        "revenue": relation["m"].get("revenue", None),
                        "isDissolved": relation["m"].get("isDissolved", None),
                        "name": relation["m"].get("name", None),
                        "isPublic": relation["m"].get("isPublic", None),
                        "category": category,
                    }
                )
            elif relation_type == "HAS_SUBSIDIARY":
                category_result = self.database.query(
                    "MATCH (n {name:$companyName})-[HAS_CATEGORY]-(c:IndustryCategory) return c.name LIMIT 1",
                    {"companyName": relation["m"].get("name", None)},
                )
                category = None
                if len(category_result) > 0:
                    category = category_result[0]["c.name"]
                article_data = self.database.query(
                    "MATCH p=(n {name:$companyName})<-[:MENTIONS]-(a:Article)-[:HAS_CHUNK]->(c:Chunk) return  c.text, a.title, a.siteName",
                    {"companyName": relation["m"].get("name", None)},
                )
                print("Article data: " + str(article_data))

                output = "There is not articles about this company."
                if len(article_data) > 0:
                    output = summarize_results.run(
                        "Can you summarize the following articles in 50 words about "
                        + relation["m"].get("name", None)
                        + " ?",
                        article_data[:HARD_LIMIT_CONTEXT_RECORDS],
                    )
                subsidiaries.append(
                    {
                        "summary": relation["m"].get("summary", None),
                        "revenue": relation["m"].get("revenue", None),
                        "isDissolved": relation["m"].get("isDissolved", None),
                        "name": relation["m"].get("name", None),
                        "isPublic": relation["m"].get("isPublic", None),
                        "category": category,
                        "articleSummary": output,
                    }
                )
            elif relation_type == "HAS_CEO":
                company_data_output["ceo"] = relation["m"]["name"]
        company_data_output["offices"] = offices
        article_data = self.database.query(
            "MATCH p=(n {name:$companyName})<-[:MENTIONS]-(a:Article)-[:HAS_CHUNK]->(c:Chunk) return  c.text, a.title, a.siteName",
            {"companyName": self.company},
        )

        output = summarize_results.run(
            "Can you summarize the following articles about " + self.company + " ?",
            article_data[:HARD_LIMIT_CONTEXT_RECORDS],
        )
        print("output: " + output)
        return {
            "company": company_data_output,
            "subsidiaries": subsidiaries,
            "suppliers": suppliers,
            "articleSummary": output,
        }
