import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

// Define the expected structure of the story data
interface StoryPage {
  pageNumber: number;
  title: string;
  content: string;
  imageUrl?: string;
}

interface Story {
  title: string;
  coverImageUrl?: string;
  pages: StoryPage[];
  coloringPageImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const story: Story = await request.json();

    if (!story || !story.title || !story.pages) {
      return NextResponse.json({ error: "Invalid story data" }, { status: 400 });
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [600, 800], // Typical storybook aspect ratio
    });

    const addImageToPdf = async (url: string | undefined, isCover = false) => {
      if (!url) return;
      try {
        // Fetch the image and convert to a buffer
        const response = await fetch(url);
        if (!response.ok) return;
        const buffer = await response.arrayBuffer();
        const imageData = new Uint8Array(buffer);
        
        // Add image to PDF
        if (isCover) {
          doc.addImage(imageData, "PNG", 0, 0, 600, 600);
          doc.setFontSize(24);
          doc.text(story.title, 300, 650, { align: "center" });
        } else {
          doc.addImage(imageData, "PNG", 50, 50, 500, 500);
        }
      } catch (error) {
        console.error("Failed to add image to PDF:", error);
      }
    };

    // 1. Add Cover Page
    await addImageToPdf(story.coverImageUrl, true);

    // 2. Add Story Pages
    for (const page of story.pages) {
      doc.addPage();
      await addImageToPdf(page.imageUrl);
      
      doc.setFontSize(18);
      doc.text(page.title, 50, 580);
      
      doc.setFontSize(12);
      // Use splitTextToSize for auto-wrapping
      const contentLines = doc.splitTextToSize(page.content, 500);
      doc.text(contentLines, 50, 610);
      
      doc.setFontSize(10);
      doc.text(`Page ${page.pageNumber}`, 300, 780, { align: "center" });
    }
    
    // 3. Add Coloring Page
    if (story.coloringPageImageUrl) {
      doc.addPage();
      doc.setFontSize(24);
      doc.text("Coloring Exercise", 300, 40, { align: "center" });
      await addImageToPdf(story.coloringPageImageUrl);
    }
    
    // Generate the PDF as a buffer
    const pdfBuffer = doc.output("arraybuffer");

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${story.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
