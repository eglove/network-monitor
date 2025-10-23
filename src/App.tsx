import "./App.css"
import {HeroUIProvider} from "@heroui/react";

import {
	QueryClient, QueryClientProvider,
} from '@tanstack/react-query'
import {Results} from "./components/results.tsx";

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<HeroUIProvider>
				<main className="min-h-screen dark text-foreground bg-background p-6 flex items-center justify-center">
					<Results/>
				</main>
			</HeroUIProvider>
		</QueryClientProvider>
	);
}

export default App;
