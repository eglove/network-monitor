import "./App.css";
import {PingResults} from "./components/ping-results.tsx";
import {TestResults} from "./components/test-results.tsx";
import {
    QueryClient, QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <main className="container">
                <PingResults/>
                <TestResults/>
            </main>
        </QueryClientProvider>
    );
}

export default App;
