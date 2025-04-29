import React from "react";
import { render, screen } from "@testing-library/react";
import NewReport from '../../../../src/renderer/src/components/main/pages/newReport';

jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div>MockIcon</div>,
}));

describe("NewReport Component", () => {
  it("renders without crashing", () => {
    render(<NewReport />);
    expect(screen.getByText(/Create New Analysis Report/i)).toBeInTheDocument();
  });
});


