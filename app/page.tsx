"use client";

import { useEffect, useMemo, useState } from "react";
import { Delete, Divide, Equal, Minus, Percent, Plus, RotateCcw, Sparkles, X } from "lucide-react";

type ButtonKind = "number" | "operator" | "utility" | "equals";

type CalculatorButton = {
  label: string;
  value: string;
  kind: ButtonKind;
  wide?: boolean;
  icon?: React.ReactNode;
};

const buttons: CalculatorButton[] = [
  { label: "Clear", value: "clear", kind: "utility", icon: <RotateCcw size={18} /> },
  { label: "Delete", value: "delete", kind: "utility", icon: <Delete size={18} /> },
  { label: "Percent", value: "%", kind: "operator", icon: <Percent size={18} /> },
  { label: "Divide", value: "/", kind: "operator", icon: <Divide size={18} /> },
  { label: "7", value: "7", kind: "number" },
  { label: "8", value: "8", kind: "number" },
  { label: "9", value: "9", kind: "number" },
  { label: "Multiply", value: "*", kind: "operator", icon: <X size={18} /> },
  { label: "4", value: "4", kind: "number" },
  { label: "5", value: "5", kind: "number" },
  { label: "6", value: "6", kind: "number" },
  { label: "Subtract", value: "-", kind: "operator", icon: <Minus size={18} /> },
  { label: "1", value: "1", kind: "number" },
  { label: "2", value: "2", kind: "number" },
  { label: "3", value: "3", kind: "number" },
  { label: "Add", value: "+", kind: "operator", icon: <Plus size={18} /> },
  { label: "0", value: "0", kind: "number", wide: true },
  { label: ".", value: ".", kind: "number" },
  { label: "Equals", value: "=", kind: "equals", icon: <Equal size={20} /> },
];

const operatorGlyphs: Record<string, string> = {
  "/": "÷",
  "*": "×",
  "-": "−",
  "+": "+",
  "%": "%",
};

function tokenize(expression: string) {
  return expression.match(/(\d+\.?\d*|\.\d+|[+\-*/%])/g) ?? [];
}

function formatExpression(expression: string) {
  if (!expression) return "0";
  return expression.replace(/[/*+%\-]/g, (match) => ` ${operatorGlyphs[match]} `).trim();
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "Error";
  const rounded = Math.abs(value) < 1e-12 ? 0 : Number(value.toPrecision(12));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
  }).format(rounded);
}

function evaluateExpression(expression: string) {
  const tokens = tokenize(expression);
  if (!tokens.length) return null;
  if (/[+\-*/%]$/.test(tokens[tokens.length - 1])) tokens.pop();

  const values: number[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };

  const applyOperator = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (operator === undefined || right === undefined || left === undefined) return;
    if (operator === "+") values.push(left + right);
    if (operator === "-") values.push(left - right);
    if (operator === "*") values.push(left * right);
    if (operator === "/") values.push(right === 0 ? Number.NaN : left / right);
    if (operator === "%") values.push((left / 100) * right);
  };

  for (const token of tokens) {
    if (/^[+\-*/%]$/.test(token)) {
      while (operators.length && precedence[operators[operators.length - 1]] >= precedence[token]) {
        applyOperator();
      }
      operators.push(token);
    } else {
      values.push(Number(token));
    }
  }

  while (operators.length) applyOperator();
  return values[0] ?? null;
}

function appendInput(expression: string, input: string) {
  if (/^\d$/.test(input)) {
    const lastNumber = expression.split(/[+\-*/%]/).pop() ?? "";
    if (lastNumber === "0") return expression.slice(0, -1) + input;
    return expression + input;
  }

  if (input === ".") {
    const lastNumber = expression.split(/[+\-*/%]/).pop() ?? "";
    if (lastNumber.includes(".")) return expression;
    return expression + (lastNumber ? "." : "0.");
  }

  if (/^[+\-*/%]$/.test(input)) {
    if (!expression) return input === "-" ? "-" : expression;
    if (/^[+\-*/%]$/.test(expression.at(-1) ?? "")) {
      return expression.slice(0, -1) + input;
    }
    return expression + input;
  }

  return expression;
}

export default function Home() {
  const [expression, setExpression] = useState("");
  const [memory, setMemory] = useState<string[]>([]);
  const [justSolved, setJustSolved] = useState(false);

  const preview = useMemo(() => {
    if (!expression || /[+\-*/%]$/.test(expression)) return "";
    const result = evaluateExpression(expression);
    return result === null ? "" : formatNumber(result);
  }, [expression]);

  const commitResult = () => {
    const result = evaluateExpression(expression);
    if (result === null) return;
    const formatted = formatNumber(result);
    if (formatted === "Error") {
      setExpression("");
      setJustSolved(false);
      return;
    }
    setMemory((items) => [`${formatExpression(expression)} = ${formatted}`, ...items].slice(0, 4));
    setExpression(String(Number(result.toPrecision(12))));
    setJustSolved(true);
  };

  const handleInput = (input: string) => {
    if (input === "clear") {
      setExpression("");
      setJustSolved(false);
      return;
    }
    if (input === "delete") {
      setExpression((current) => current.slice(0, -1));
      setJustSolved(false);
      return;
    }
    if (input === "=") {
      commitResult();
      return;
    }

    setExpression((current) => {
      const base = justSolved && /^\d|\./.test(input) ? "" : current;
      return appendInput(base, input);
    });
    setJustSolved(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (/^\d$/.test(key) || key === ".") handleInput(key);
      if (["+", "-", "*", "/", "%"].includes(key)) handleInput(key);
      if (key === "Enter" || key === "=") handleInput("=");
      if (key === "Backspace") handleInput("delete");
      if (key === "Escape") handleInput("clear");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <main className="stage">
      <section className="brand-panel" aria-label="Calculator overview">
        <div className="brand-mark">
          <Sparkles size={22} />
        </div>
        <div>
          <p className="eyebrow">Next.js calculator</p>
          <h1>Luma</h1>
        </div>
        <p className="brand-copy">
          A crisp, responsive calculator with keyboard support, instant previews, and a compact session trail.
        </p>
        <div className="metrics">
          <span>React</span>
          <span>Next.js</span>
          <span>TypeScript</span>
        </div>
      </section>

      <section className="calculator" aria-label="Calculator">
        <div className="display">
          <div className="history">
            {memory.length ? memory.map((item) => <span key={item}>{item}</span>) : <span>Ready</span>}
          </div>
          <output className="expression" aria-live="polite">
            {formatExpression(expression)}
          </output>
          <div className="preview">{preview && preview !== formatExpression(expression) ? preview : "\u00a0"}</div>
        </div>

        <div className="keypad">
          {buttons.map((button) => (
            <button
              key={`${button.label}-${button.value}`}
              className={`key ${button.kind} ${button.wide ? "wide" : ""}`}
              type="button"
              onClick={() => handleInput(button.value)}
              aria-label={button.label}
              title={button.label}
            >
              {button.icon ?? button.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
