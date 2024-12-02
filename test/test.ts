import { getGoodbyeName, getHelloName } from "./build";

// Need project to test if tranpilation is correct
describe("Test building a simple program", function () {
  test("Validate build function", function () {
    const name = "Steve";
    expect(getHelloName(name)).toBe("Hello Steve!");
    expect(getGoodbyeName(name)).toBe("Goodbye Steve!");
  });

  test("Name is Admin", function () {
    const name = "Admin";
    expect(getHelloName(name)).toBe("Hello John!");
    expect(getGoodbyeName(name)).toBe("Goodbye Admin!");
  });
});
