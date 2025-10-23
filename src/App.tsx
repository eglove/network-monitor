import "./styles/result-table.css";
import {
    QueryClient, QueryClientProvider,
} from '@tanstack/react-query'
import {Results} from "./components/results.tsx";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <main className="app-container">
                <Results />
            </main>
        </QueryClientProvider>
    );
}

export default App;
