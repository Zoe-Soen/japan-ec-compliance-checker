import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../src/App.jsx";

describe("compliance checker demo", () => {
  it("completes the four-step mock inspection flow", async () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /继续设置检查范围/ }));
    expect(screen.getByRole("heading", { name: "确认本次检查范围" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /开始自动检查/ }));
    expect(screen.getByRole("heading", { name: "正在检查网站公开页面" })).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(2600);
    });

    expect(screen.getByRole("heading", { name: "模拟检查已完成" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /查看风险报告/ }));

    expect(screen.getByText("发现 7 项问题 · 5 项需优先处理")).toBeTruthy();
    expect(screen.getAllByText("退货条件不明确").length).toBeGreaterThan(0);
  });

  it("updates evidence details when a finding is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "检查记录" }));
    await user.click(screen.getByRole("button", { name: /Sakura Select 日本站/ }));
    await user.click(screen.getByRole("button", { name: /送料说明不完整/ }));

    expect(screen.getByText("送料は注文内容により異なります。")).toBeTruthy();
    expect(screen.getByText(/明确日本境内各地区送料/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "关闭详情" }));
    expect(screen.getByText("选择检查项查看证据")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /送料说明不完整/ }));
    expect(screen.getByText("送料は注文内容により異なります。")).toBeTruthy();
  });

  it("keeps the records and rules navigation usable", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "检查记录" }));
    expect(screen.getByRole("heading", { name: "检查记录" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "规则说明" }));
    expect(screen.getByRole("heading", { name: "规则说明" })).toBeTruthy();
    expect(screen.getByText("特定商取引法及基础交易信息")).toBeTruthy();
  });
});
