import { useEffect } from "react"

export default function NotFoundPage() {

    useEffect(() => {
        document.title = 'ㄲㅡㅌ : 말잇기 - 404 Not Found';
    }, []);

    return (<div className="not-found">
        잘못된 접근입니다. <br/>
        404 Not Found
    </div>)
}