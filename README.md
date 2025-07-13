# PDF Annotator

A web-based application for viewing and annotating PDF documents directly in the browser. Built with Next.js and TypeScript.

## Features

- **PDF Viewing**: Render and view PDF documents seamlessly.
- **File Upload**: Easily upload PDF files from your local machine.
- **Annotation Tools**: Add text and drawings to your documents.
- **Layer Management**: Organize annotations with a simple layers panel.
- **State Management**: Powered by Zustand for efficient and predictable state changes.

## Tech Stack

- [Next.js](https://nextjs.org/) - React Framework
- [React](https://reactjs.org/) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
- [Zustand](https://github.com/pmndrs/zustand) - State Management
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [React-PDF](https://github.com/wojtekmaj/react-pdf) - PDF rendering for React

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or later)
- [pnpm](https://pnpm.io/installation)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd pdf-annotator
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm run dev
    ```

4.  Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## Available Scripts

- `pnpm run dev`: Starts the development server.
- `pnpm run build`: Creates a production build.
- `pnpm run start`: Starts the production server.
- `pnpm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.