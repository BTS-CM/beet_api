/**
 * 
 * @param result 
 * @returns 
 */
function validResult (result: Object) {
    return new Response(
        JSON.stringify({
          message: "Success!",
          result
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
}

export {
    validResult
}