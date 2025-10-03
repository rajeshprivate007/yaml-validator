// frontend/src/App.jsx
import { useState } from "react";
import Editor from "@monaco-editor/react";

export default function App() {
  const [yamlText, setYamlText] = useState(`# paste your YAML here\n`);
  const [fixedYaml, setFixedYaml] = useState("");
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function validate() {
    setLoading(true);
    setErrors([]);
    setMessage("");
    setFixedYaml("");

    try {
      const resp = await fetch("http://localhost:4000/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: yamlText }),
      });
      const data = await resp.json();
      if (data.valid) {
        setFixedYaml(data.fixedYaml || "");
        setMessage(data.message || "Valid YAML");
      } else {
        setErrors(data.errors || ["Unknown parsing error"]);
      }
    } catch (e) {
      setErrors([e.message || String(e)]);
    } finally {
      setLoading(false);
    }
  }

  function applyFixed() {
    setYamlText(fixedYaml);
    setFixedYaml("");
    setMessage("Applied fixed YAML to editor");
  }

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
      <h1>YAML Validator & Fixer</h1>

      <label><strong>Input YAML</strong></label>
      <Editor
        height="300px"
        defaultLanguage="yaml"
        value={yamlText}
        onChange={(value) => setYamlText(value || "")}
        options={{
          lineNumbers: "on",
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={validate} disabled={loading}>
          {loading ? "Validating..." : "Validate & Fix"}
        </button>
      </div>

      {message && <div style={{ marginTop: 12, color: "green" }}>{message}</div>}

      {errors.length > 0 && (
        <div style={{ marginTop: 12, color: "#b00020" }}>
          <h3>Errors</h3>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>
                <pre style={{ whiteSpace: "pre-wrap" }}>{e}</pre>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fixedYaml && (
        <div style={{ marginTop: 12 }}>
          <h3>Fixed YAML</h3>
          <Editor
            height="250px"
            defaultLanguage="yaml"
            value={fixedYaml}
            options={{
              readOnly: true,
              lineNumbers: "on",
              fontSize: 14,
              minimap: { enabled: false },
            }}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={applyFixed}>Use this fixed YAML in editor</button>
            <a
              style={{ marginLeft: 12 }}
              href={`data:text/yaml;charset=utf-8,${encodeURIComponent(fixedYaml)}`}
              download="fixed.yaml"
            >
              Download fixed.yaml
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
