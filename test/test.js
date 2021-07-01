var assert = require("assert");
import todo from "../dist/react";

describe("Package", function () {
  it("works", ()=>{
    assert.equal(todo(), 42);
  });
});
