import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import { lineNumbers } from "@codemirror/view";  // 👈 import

function App() {
  const [yamlCode, setYamlCode] = useState("");
  const [result, setResult] = useState(null);

  const validateYaml = async () => {
    try {
      const response = await fetch("http://localhost:4000/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: yamlCode }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#f4f6f9", minHeight: "100vh", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "20px", color: "#333" }}>
        YAML Validator & Auto-Fix
      </h1>

      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
        <CodeMirror
          value={yamlCode}
          height="500px"
          extensions={[
            yaml(),
            lineNumbers(),   // 👈 continuous line numbers enabled
          ]}
          theme={oneDark}
          onChange={(value) => setYamlCode(value)}
        />
      </div>

      <button
        onClick={validateYaml}
        style={{
          marginTop: "20px",
          padding: "12px 25px",
          fontSize: "1rem",
          fontWeight: "bold",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Validate & Fix
      </button>

      {result && (
        <div style={{ marginTop: "25px", padding: "20px", width: "100%", maxWidth: "800px", margin: "0 auto", border: "1px solid #ddd", borderRadius: "8px", background: "#fff", fontFamily: "monospace", whiteSpace: "pre-wrap", textAlign: "left" }}>
          <strong>Result:</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
