export class QuillManager {
    static getQuillFromMaybeQuillString(
        maybeQuillString: string|undefined
    ): any {
        let response: any;

        if (maybeQuillString === undefined){
            response = {
                "ops": [
                    {
                        "insert":  maybeQuillString + "\n"
                    }
                ]
            };
        } else {
            try {
                response = JSON.parse(maybeQuillString);
            } catch (e) {
                response = {
                    "ops": [
                        {
                            "insert": maybeQuillString + "\n"
                        }
                    ]
                };
            }
        }

        return response;
    }
}