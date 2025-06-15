  let currentPdfData = null;
        let extractedTextContent = '';

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        document.getElementById('fileInput').addEventListener('change', handleFileSelect);

        const uploadArea = document.querySelector('.upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#2196f3';
            uploadArea.style.backgroundColor = '#e3f2fd';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#e3f2fd';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#e3f2fd';
            uploadArea.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                document.getElementById('fileInput').files = files;
                handleFileSelect({ target: { files: files } });
            }
        });

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (file.type !== 'application/pdf') {
                showError('Please select a valid PDF file.');
                return;
            }

            currentPdfData = file;
            updateFileInfo(file);
            document.getElementById('extractBtn').disabled = false;
            
            showSuccess(`PDF file "${file.name}" loaded successfully!`);
        }

        function updateFileInfo(file) {
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('docType').textContent = 'PDF Document';
            document.getElementById('status').textContent = 'Ready';
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        async function extractInfo() {
            if (!currentPdfData) {
                showError('Please select a PDF file first.');
                return;
            }

            const extractBtn = document.getElementById('extractBtn');
            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');
            const resultsSection = document.getElementById('resultsSection');

            extractBtn.disabled = true;
            extractBtn.textContent = 'Extracting...';
            progressBar.style.display = 'block';
            resultsSection.style.display = 'block';

            try {
                // Simulate progress
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 20;
                    if (progress > 90) progress = 90;
                    progressFill.style.width = progress + '%';
                }, 200);

                const arrayBuffer = await currentPdfData.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                document.getElementById('pageCount').textContent = pdf.numPages;
                
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += `\n--- Page ${i} ---\n${pageText}\n`;
                }

                extractedTextContent = fullText;
                
                clearInterval(progressInterval);
                progressFill.style.width = '100%';
                
                setTimeout(() => {
                    progressBar.style.display = 'none';
                    displayResults(fullText);
                    extractBtn.disabled = false;
                    extractBtn.textContent = 'Extract Information';
                    document.getElementById('status').textContent = 'Completed';
                }, 500);

            } catch (error) {
                console.error('Error extracting PDF:', error);
                showError('Error extracting PDF content. Please try again.');
                extractBtn.disabled = false;
                extractBtn.textContent = 'Extract Information';
                progressBar.style.display = 'none';
            }
        }

        function displayResults(text) {
            document.getElementById('extractedText').textContent = text || 'No text content found in the PDF.';
            
            const keyInfo = analyzeContent(text);
            document.getElementById('keyInfo').innerHTML = keyInfo;
        }

        function analyzeContent(text) {
            if (!text) return '<p>No content to analyze.</p>';

            const analysis = [];
            
            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
            const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g;
            const numberPattern = /\b\d+\b/g;

            const emails = text.match(emailPattern) || [];
            const phones = text.match(phonePattern) || [];
            const dates = text.match(datePattern) || [];
            const numbers = text.match(numberPattern) || [];

            const words = text.split(/\s+/).filter(word => word.length > 0);
            const wordCount = words.length;
            const charCount = text.length;

            analysis.push(`<strong>📊 Document Statistics:</strong><br>`);
            analysis.push(`• Word count: ${wordCount}<br>`);
            analysis.push(`• Character count: ${charCount}<br>`);
            analysis.push(`• Estimated reading time: ${Math.ceil(wordCount / 200)} minutes<br><br>`);

            if (emails.length > 0) {
                analysis.push(`<strong>📧 Email addresses found:</strong><br>`);
                emails.slice(0, 5).forEach(email => analysis.push(`• ${email}<br>`));
                if (emails.length > 5) analysis.push(`• ... and ${emails.length - 5} more<br>`);
                analysis.push('<br>');
            }

            if (phones.length > 0) {
                analysis.push(`<strong>📞 Phone numbers found:</strong><br>`);
                phones.slice(0, 5).forEach(phone => analysis.push(`• ${phone}<br>`));
                if (phones.length > 5) analysis.push(`• ... and ${phones.length - 5} more<br>`);
                analysis.push('<br>');
            }

            if (dates.length > 0) {
                analysis.push(`<strong>📅 Dates found:</strong><br>`);
                [...new Set(dates)].slice(0, 5).forEach(date => analysis.push(`• ${date}<br>`));
                analysis.push('<br>');
            }

            const electionTerms = ['polling', 'booth', 'constituency', 'voter', 'election', 'candidate', 'ballot'];
            const foundTerms = electionTerms.filter(term => 
                text.toLowerCase().includes(term.toLowerCase())
            );

            if (foundTerms.length > 0) {
                analysis.push(`<strong>🗳️ Election-related terms found:</strong><br>`);
                foundTerms.forEach(term => analysis.push(`• ${term}<br>`));
                analysis.push('<br>');
            }

            return analysis.join('');
        }

        function clearResults() {
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('fileInput').value = '';
            document.getElementById('extractBtn').disabled = true;
            currentPdfData = null;
            extractedTextContent = '';
            
            document.getElementById('docType').textContent = '-';
            document.getElementById('pageCount').textContent = '-';
            document.getElementById('fileSize').textContent = '-';
            document.getElementById('status').textContent = 'Ready';
            
            showSuccess('Results cleared. Ready for new PDF upload.');
        }

        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            document.querySelector('.upload-section').appendChild(errorDiv);
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }

        function showSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success';
            successDiv.textContent = message;
            document.querySelector('.upload-section').appendChild(successDiv);
            
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        }
    </script>