import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import TodoClient from "../components/todo/TodoClient";
import { createClient } from "../utils/supabase/client";
jest.mock("../utils/supabase/client", () => ({
  createClient: jest.fn(),
}));
const mockTodoData = [
  {
    id: 1,
    title: "Test Todo 1",
    priority: "High",
    created_at: new Date(),
    updated_at: null,
    deleted_at: null,
  },
  {
    id: 2,
    title: "Test Todo 2",
    priority: "Low",
    created_at: new Date(),
    updated_at: null,
    deleted_at: null,
  },
];
describe("TodoClient Component", () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockUpdate: jest.Mock;
  beforeEach(() => {
    mockFrom = jest.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      is: jest.fn(() => ({
        select: mockSelect,
      })),
    }));
    mockSelect = jest.fn(() => ({
      data: mockTodoData,
      error: null,
    }));
    mockUpdate = jest.fn(() => ({
      data: [],
      error: null,
    }));
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  test("displays todos fetched from Supabase", async () => {
    render(<TodoClient />);
    expect(screen.getByText(/No todos found/i)).toBeInTheDocument();
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith("todos"));
    expect(screen.getByText(/Test Todo 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Todo 2/i)).toBeInTheDocument();
  });
  test("handles empty todos list", async () => {
    // Return no data in the mock
    mockSelect.mockReturnValueOnce({ data: [], error: null });
    render(<TodoClient />);
    await waitFor(() => {
      expect(screen.getByText(/No todos found/i)).toBeInTheDocument();
    });
  });
  test("deletes a todo", async () => {
    render(<TodoClient />);
    await waitFor(() => {
      expect(screen.getByText(/Test Todo 1/i)).toBeInTheDocument();
    });
    const deleteButton = screen.getAllByRole("button", { name: "X" })[0];
    fireEvent.click(deleteButton);
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByText(/Test Todo 1/i)).not.toBeInTheDocument();
    });
  });
  test("handles Supabase errors gracefully", async () => {
    mockSelect.mockReturnValueOnce({
      data: null,
      error: new Error("Error fetching todos"),
    });
    render(<TodoClient />);
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled();
    });
    expect(screen.getByText(/No todos found/i)).toBeInTheDocument();
  });
});