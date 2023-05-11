import { Button, TextLink } from "@neo4j-ndl/react";

import "@neo4j-ndl/base/lib/neo4j-ds-styles.css";

function App() {
  return (
    <div className="flex place-items-center min-w-[320px] min-h-[100vh]">
      Hello World
      <Button>Click</Button>
      <TextLink href="https://neo4j.com">Neo4j</TextLink>
    </div>
  );
}

export default App;
