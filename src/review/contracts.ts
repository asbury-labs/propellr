// Semantic text-capture contract. Inputs derive from schemas; browser analysis imports types only.
// Separate from ScanResult, occurrence evidence, reports and gates: none of them consume it.
import type {
  ValidatedRedactedTextCapture,
  ValidatedTextCapture,
  TextField,
} from "./validation.js";

export type TextCapture = ValidatedTextCapture;
export type TextTarget = Extract<TextCapture, { state: "available" }>["targets"][number];
export type NameText = TextTarget["name"];
export type RedactedTextCapture = ValidatedRedactedTextCapture;
export type RedactedTextTarget = Extract<
  RedactedTextCapture,
  { state: "available" }
>["targets"][number];
export type RedactedField = TextField;
