import { describe, expect, it } from "vitest";
import { validateCreatePayload } from "./validation";

const valid = {
  name: "日本站上线检查",
  url: "https://example.com",
  scope: { location: "overseas", entity: "company", category: "ordinary", sales: "single", shipping: "overseas" },
};

describe("create check payload", () => {
  it("accepts the five-question MVP scope", () => {
    expect(validateCreatePayload(valid)).toMatchObject({ name: valid.name, scanType: "site_full" });
  });

  it("rejects missing or unknown scope values", () => {
    expect(() => validateCreatePayload({ ...valid, scope: { ...valid.scope, category: "medicine" } })).toThrow("检查范围选项不完整");
    expect(() => validateCreatePayload({ ...valid, name: "" })).toThrow("项目名称");
  });
});
