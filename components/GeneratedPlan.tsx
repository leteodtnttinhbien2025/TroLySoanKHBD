import React, { useState, useRef } from 'react';
import { CopyIcon } from './icons';
import katex from 'katex';

interface GeneratedPlanProps {
  planContent: string;
}

// Helper to robustly parse a markdown table row, handling optional leading/trailing pipes.
const parseTableRow = (line: string): string[] => {
  let processedLine = line.trim();
  if (processedLine.startsWith('|')) {
    processedLine = processedLine.substring(1);
  }
  if (processedLine.endsWith('|')) {
    processedLine = processedLine.slice(0, -1);
  }
  return processedLine.split('|').map(cell => cell.trim());
};


const GeneratedPlan: React.FC<GeneratedPlanProps> = ({ planContent }) => {
  const [copyStatus, setCopyStatus] = useState('Sao chép');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (!contentRef.current) return;

    try {
      const contentHtml = contentRef.current.innerHTML;
      
      // Inject styles to preserve formatting when pasting into rich text editors
      const styles = `
        <style>
          body { font-family: 'Inter', sans-serif; color: #1f2937; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
          th, td { border: 1px solid #d1d5db; padding: 0.5rem 1rem; text-align: left; }
          th { background-color: #f3f4f6; font-weight: 600; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          h1 { font-size: 1.25rem; font-weight: 700; text-align: center; margin-bottom: 1rem; text-transform: uppercase; color: #111827; }
          h2 { font-size: 1.125rem; font-weight: 700; text-transform: uppercase; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #4338ca; border-bottom: 1px solid #e0e7ff; padding-bottom: 0.25rem; }
          h3 { font-size: 1rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.25rem; color: #111827; }
          ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
          li { margin-bottom: 0.25rem; }
          p { margin-bottom: 0.5rem; }
          strong { font-weight: 700; }
        </style>
      `;

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
            ${styles}
          </head>
          <body>${contentHtml}</body>
        </html>
      `;

      const blobHtml = new Blob([fullHtml], { type: 'text/html' });
      const blobText = new Blob([contentRef.current.innerText], { type: 'text/plain' });

      const data = [new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
      })];

      await navigator.clipboard.write(data);
      setCopyStatus('Đã sao chép!');
    } catch (err) {
      console.error('Could not copy HTML: ', err);
      // Fallback to standard text copy
      try {
        await navigator.clipboard.writeText(planContent);
        setCopyStatus('Đã sao chép (Text)!');
      } catch (fallbackErr) {
         setCopyStatus('Lỗi!');
      }
    }
    setTimeout(() => setCopyStatus('Sao chép'), 2000);
  };

  const parseInline = (text: string): React.ReactNode => {
    if (!text) return '';
    // Updated regex to include LaTeX delimiters: $$...$$ (block) and $...$ (inline)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$]+\$|\*\*.*?\*\*|<br\s*\/?>)/gi;
    const parts = text.split(regex).filter(Boolean);

    return parts.map((part, index) => {
      const key = `part-${index}`;
      
      if (part.match(/^<br\s*\/?>$/i)) {
        return <br key={key} />;
      }

      // Block Math
      if (part.startsWith('$$') && part.endsWith('$$')) {
        try {
          const html = katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true });
          return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <code key={key}>{part}</code>;
        }
      }

      // Inline Math
      if (part.startsWith('$') && part.endsWith('$')) {
        try {
          const html = katex.renderToString(part.slice(1, -1), { throwOnError: false, displayMode: false });
          return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          return <code key={key}>{part}</code>;
        }
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return <strong key={key} className="font-bold">{parseInline(content)}</strong>;
      }

      // Remove any remaining asterisks from the displayed text (as requested)
      return part.replace(/\*/g, '');
    });
  };

  const renderMarkdown = (content: string) => {
    const allLines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    let i = 0;
    while (i < allLines.length) {
      const line = allLines[i];
      const trimmedLine = line.trim();
      const key = `line-${i}`;
      const nextLine = i + 1 < allLines.length ? allLines[i + 1].trim() : null;
      
      // Handle left-aligned header block
      if (trimmedLine.startsWith('**Trường:**') || trimmedLine.startsWith('**Tổ:**') || trimmedLine.startsWith('**Họ và tên giáo viên:**')) {
        const headerBlockLines: React.ReactNode[] = [];
        let blockIndex = i;
        // Consume all consecutive header lines, allowing for blank lines between them
        while (blockIndex < allLines.length) {
            const blockLine = allLines[blockIndex];
            const trimmedBlockLine = blockLine.trim();
            if (trimmedBlockLine.startsWith('**Trường:**') || trimmedBlockLine.startsWith('**Tổ:**') || trimmedBlockLine.startsWith('**Họ và tên giáo viên:**')) {
                headerBlockLines.push(<p key={`header-${blockIndex}`} className="mb-0">{parseInline(blockLine)}</p>);
                blockIndex++;
            } else if (trimmedBlockLine === '' && headerBlockLines.length > 0) {
                blockIndex++;
            } else {
                break; // Stop if it's not a header line or a blank line within the header
            }
        }
        elements.push(<div key={`header-block-${i}`} className="text-left mb-6">{headerBlockLines}</div>);
        i = blockIndex; // Move main index past the processed block
        continue;
      }

      // Handle tables
      if (trimmedLine.includes('|') && nextLine && nextLine.includes('---') && /^[\s|:-]+$/.test(nextLine)) {
        const tableKey = `table-${i}`;
        const headerCells = parseTableRow(trimmedLine);
        const alignParts = parseTableRow(allLines[i + 1]);
        const alignments = alignParts.map(part => {
            if (part.startsWith(':') && part.endsWith(':')) return 'center';
            if (part.endsWith(':')) return 'right';
            return 'left';
        });
        
        const getAlignmentClass = (align: string) => align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

        const header = (
          <thead key={`${tableKey}-head`} className="bg-gray-100">
            <tr>
              {headerCells.map((cell, cellIndex) => (
                <th key={`${tableKey}-th-${cellIndex}`} className={`px-4 py-2 border border-gray-300 font-semibold text-gray-800 ${getAlignmentClass(alignments[cellIndex] || 'left')} ${cellIndex === 0 && headerCells.length === 2 ? 'w-2/3' : ''}`}>
                  {parseInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
        );
        
        const bodyRows: React.ReactNode[] = [];
        let rowIndex = i + 2;
        let trIndex = 0;
        while (rowIndex < allLines.length) {
          const rowLine = allLines[rowIndex].trim();
          if (rowLine === '' || !rowLine.includes('|') || (rowLine.includes('---') && /^[\s|:-]+$/.test(rowLine))) {
            break;
          }
          const rowCells = parseTableRow(rowLine);
          while (rowCells.length < headerCells.length) rowCells.push('');

          const rowBgClass = trIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';

          bodyRows.push(
              <tr key={`${tableKey}-row-${rowIndex}`} className={rowBgClass}>
                  {rowCells.slice(0, headerCells.length).map((cell, cellIndex) => (
                      <td key={`${tableKey}-cell-${rowIndex}-${cellIndex}`} className={`px-4 py-2 border border-gray-300 align-top break-words text-gray-800 ${getAlignmentClass(alignments[cellIndex] || 'left')}`}>
                          {parseInline(cell)}
                      </td>
                  ))}
              </tr>
          );
          rowIndex++;
          trIndex++;
        }
        const body = <tbody key={`${tableKey}-body`}>{bodyRows}</tbody>;

        elements.push(
          <div key={tableKey} className="my-4 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 table-fixed">
              {header}{body}
            </table>
          </div>
        );
        i = rowIndex;
        continue;
      }
      
      // Handle headings and other text elements
      if (/^\*\*KẾ HOẠCH BÀI DẠY\*\*$/.test(trimmedLine)) {
        elements.push(<h1 key={key} className="text-center text-xl font-bold uppercase mb-4 text-gray-900">{parseInline(trimmedLine.replace(/\*\*/g, ''))}</h1>);
      } else if (trimmedLine.startsWith('**TÊN BÀI DẠY:') || trimmedLine.startsWith('**Môn học:') || trimmedLine.startsWith('**Thời gian thực hiện:')) {
        elements.push(<p key={key} className="text-center mb-1 font-bold text-gray-900">{parseInline(line)}</p>);
      } else if (/^\*\*([IVX]+\.\s.+)\*\*$/.test(trimmedLine) || /^\*\*IV\.\s+PHỤ\s+LỤC\*\*$/.test(trimmedLine)) {
        elements.push(<h2 key={key} className="text-lg font-bold uppercase mt-6 mb-2 text-indigo-700 border-b border-indigo-200 pb-1">{parseInline(trimmedLine.replace(/\*\*/g, ''))}</h2>);
      } else if (/^\*\*(\d+\..+)\*\*$/.test(trimmedLine)) {
        elements.push(<h3 key={key} className="text-base font-bold mt-4 mb-1 text-gray-900">{parseInline(trimmedLine.replace(/\*\*/g, ''))}</h3>);
      } else if (/^\*\*[a-z]\).+\*\*$/.test(trimmedLine)) {
        elements.push(<p key={key} className="font-bold">{parseInline(trimmedLine)}</p>);
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const listItems: React.ReactNode[] = [];
        let listStartIndex = i;
        while (i < allLines.length && (allLines[i].trim().startsWith('- ') || allLines[i].trim().startsWith('* '))) {
          listItems.push(<li key={`li-${i}`} className="ml-5">{parseInline(allLines[i].trim().substring(2))}</li>);
          i++;
        }
        elements.push(<ul key={`ul-${listStartIndex}`} className="list-disc list-inside mb-2 space-y-1">{listItems}</ul>);
        continue; // Skip the increment at the end
      } else if (trimmedLine) {
        elements.push(<p key={key} className="mb-1">{parseInline(line)}</p>);
      }
      
      i++;
    }
    return elements;
  };

  return (
    <div className="relative group border border-gray-200 rounded-lg p-6 bg-white shadow-inner">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
          aria-live="polite"
        >
          <CopyIcon />
          <span>{copyStatus}</span>
        </button>
      </div>

      <div className="prose prose-sm max-w-none" ref={contentRef}>
        {renderMarkdown(planContent)}
      </div>
    </div>
  );
};

export default GeneratedPlan;