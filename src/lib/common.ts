import * as fflate from "fflate";

// Creates a gzip compressed binary string
const compressContent = (content: any) => {
  return fflate.strFromU8(fflate.compressSync(fflate.strToU8(JSON.stringify(content))), true);
};

/**
 * Returns a valid response object, with optional compression
 * @param result
 * @returns
 */
function validResult(result: Object, compress: Boolean = true) {
  return new Response(
    JSON.stringify({
      message: "Success!",
      result: compress ? compressContent(result) : result,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export { validResult };
