const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const YAML = require('yaml');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Try parsing YAML, return { parsed } or { error }
function tryParse(text) {
  try {
    const parsed = YAML.parse(text);
    return { parsed };
  } catch (err) {
    return { error: err };
  }
}

// Use YAML.stringify to produce nicely formatted YAML
function formatYaml(obj) {
  return YAML.stringify(obj);
}

// Simple auto-fix for indentation/tabs problems
function attemptAutoFix(yamlText) {
  // 1) Convert tabs to two spaces
  let fixed = yamlText.replace(/\t/g, '  ');

  // 2) Remove trailing spaces on each line
  fixed = fixed.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');

  // 3) Normalize leading spaces to nearest even number (2-space indentation)
  fixed = fixed.split('\n').map(line => {
    const m = line.match(/^(\s+)(.*)$/);
    if (!m) return line;
    const leading = m[1].length;
    const target = Math.round(leading / 2) * 2; // to nearest even
    return ' '.repeat(target) + m[2];
  }).join('\n');

  return fixed;
}

app.post('/validate', (req, res) => {
  const yamlText = (req.body && req.body.yaml) || '';
  if (typeof yamlText !== 'string') {
    return res.status(400).json({ valid: false, errors: ['Request must include a "yaml" string in JSON body.'] });
  }

  // 1) Try parsing as-is
  const first = tryParse(yamlText);
  if (first.parsed) {
    return res.json({
      valid: true,
      fixedYaml: formatYaml(first.parsed),
      message: 'Valid YAML (formatted).'
    });
  }

  // 2) If parsing failed, inspect the error to decide whether to attempt whitespace fixes
  const errMsg = first.error && first.error.message ? first.error.message : String(first.error);
  const lower = errMsg.toLowerCase();
  const indentKeywords = ['indent', 'indentation', 'tab', 'bad indentation', 'unexpected indent'];

  if (indentKeywords.some(k => lower.includes(k))) {
    // attempt an auto-fix
    const attempted = attemptAutoFix(yamlText);
    const second = tryParse(attempted);
    if (second.parsed) {
      return res.json({
        valid: true,
        fixedYaml: formatYaml(second.parsed),
        fixedBy: 'auto-indentation-fix',
        message: 'Auto-fixed whitespace/indentation and formatted YAML.'
      });
    } else {
      // return both errors for clarity
      return res.json({
        valid: false,
        errors: [errMsg, second.error && second.error.message].filter(Boolean)
      });
    }
  }

  // 3) Otherwise return the parsing error(s)
  return res.json({ valid: false, errors: [errMsg] });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`YAML validator API listening on http://localhost:${PORT}`);
});