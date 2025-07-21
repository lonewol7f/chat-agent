export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { input_text, session_id, end_session, session_attributes } = body

        // Make the actual API call to your AWS endpoint
        const apiResponse = await fetch("https://obz7hjinr4.execute-api.ap-south-1.amazonaws.com/dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                input_text,
                session_id,
                end_session,
                session_attributes,
            }),
        })

        if (!apiResponse.ok) {
            throw new Error(`API responded with status: ${apiResponse.status}`)
        }

        const data = await apiResponse.json()
        return Response.json(data)
    } catch (error) {
        console.error("API Error:", error)
        const body = await req.json() // Declare the body variable before using it

        // Return a fallback response when the API fails
        if (body?.end_session) {
            return Response.json({
                response: "Session ended (offline mode - API unavailable)",
                session_ended: true,
            })
        }

        return Response.json({
            response: `I apologize, but I'm currently unable to connect to the chat service. This might be due to network issues or server maintenance. Please try again later.\n\nError details: ${error instanceof Error ? error.message : "Unknown error"}`,
            error: true,
        })
    }
}
