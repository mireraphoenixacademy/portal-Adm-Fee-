document.addEventListener('DOMContentLoaded', () => {
    const USERNAME = 'mpaAdmin';
    const PASSWORD = 'sysAdmin368';

    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const mainApp = document.getElementById('mainApp');
    const logoutBtn = document.getElementById('logoutBtn');
    const transferRequestsInput = document.getElementById('transferRequests');
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');

    localStorage.removeItem('isLoggedIn');
    loginModal.style.display = 'block';
    mainApp.style.display = 'none';

    hamburger.addEventListener('click', () => sidebar.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target) && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === USERNAME && password === PASSWORD) {
            localStorage.setItem('isLoggedIn', 'true');
            loginModal.style.display = 'none';
            mainApp.style.display = 'block';
            await fetchData();
            await fetchArchivedYears();
            await fetchTermSettings();
        } else {
            alert('Invalid credentials');
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        loginModal.style.display = 'block';
        mainApp.style.display = 'none';
        sidebar.classList.remove('active');
    });

    transferRequestsInput.addEventListener('change', () => {
        localStorage.setItem('transferRequests', transferRequestsInput.value);
    });

    const savedTransferRequests = localStorage.getItem('transferRequests');
    if (savedTransferRequests) transferRequestsInput.value = savedTransferRequests;

    let learners = [];
    let fees = [];
    let books = [];
    let classBooks = [];
    let feeStructure = {};
    let currentTerm = 'Term 1';
    let currentYear = new Date().getFullYear();

    const addLearnerBtn = document.querySelector('.add-learner-btn');
    const addFeeBtn = document.querySelector('.add-fee-btn');
    const addBookBtn = document.querySelector('.add-book-btn');
    const addClassBookBtn = document.querySelector('.add-class-book-btn');
    const addLearnerForm = document.getElementById('addLearnerForm');
    const addFeeForm = document.getElementById('addFeeForm');
    const addBookForm = document.getElementById('addBookForm');
    const addClassBookForm = document.getElementById('addClassBookForm');
    const editLearnerForm = document.getElementById('editLearnerForm');
    const editFeeForm = document.getElementById('editFeeForm');
    const editBookForm = document.getElementById('editBookForm');
    const editClassBookForm = document.getElementById('editClassBookForm');
    const learnerForm = document.getElementById('learnerForm');
    const editLearnerFormElement = document.getElementById('editLearnerFormElement');
    const feeForm = document.getElementById('feeForm');
    const editFeeFormElement = document.getElementById('editFeeFormElement');
    const bookForm = document.getElementById('bookForm');
    const editBookFormElement = document.getElementById('editBookFormElement');
    const classBookForm = document.getElementById('classBookForm');
    const editClassBookFormElement = document.getElementById('editClassBookFormElement');
    const learnersBody = document.getElementById('learnersBody');
    const feesBody = document.getElementById('feesBody');
    const booksBody = document.getElementById('booksBody');
    const classBooksBody = document.getElementById('classBooksBody');
    const feeStructureForm = document.getElementById('feeStructureForm');
    const termSettingsForm = document.getElementById('termSettingsForm');
    let currentPage = 1;
    const entriesPerPage = 10;

    async function fetchData() {
        try {
            const [learnersRes, feesRes, booksRes, classBooksRes, feeStructureRes] = await Promise.all([
                fetch('/api/learners'),
                fetch('/api/fees'),
                fetch('/api/books'),
                fetch('/api/classBooks'),
                fetch('/api/feeStructure')
            ]);
            learners = await learnersRes.json();
            fees = await feesRes.json();
            books = await booksRes.json();
            classBooks = await classBooksRes.json();
            feeStructure = await feeStructureRes.json() || {};
            renderLearners();
            renderFees();
            renderBooks();
            renderClassBooks();

            // Show the dashboard section by default
            document.querySelectorAll('section').forEach(s => s.style.display = 'none');
            document.getElementById('dashboard').style.display = 'block';
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }

    async function fetchTermSettings() {
        try {
            const response = await fetch('/api/termSettings');
            const settings = await response.json();
            currentTerm = settings.currentTerm || 'Term 1';
            currentYear = settings.currentYear || new Date().getFullYear();
            document.getElementById('currentTermYear').textContent = `${currentTerm} ${currentYear}`;
            document.getElementById('currentTerm').value = currentTerm;
            document.getElementById('currentYear').value = currentYear;
        } catch (err) {
            console.error('Error fetching term settings:', err);
        }
    }

    function getNextAdmissionNo() {
        const maxAdmission = learners.reduce((max, learner) => {
            const num = parseInt(learner.admissionNo.replace('MPA-', ''));
            return num > max ? num : max;
        }, 0);
        return `MPA-${String(maxAdmission + 1).padStart(3, '0')}`;
    }

    function renderLearners() {
        learnersBody.innerHTML = '';
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const paginatedLearners = learners.slice(start, end);

        paginatedLearners.forEach((learner, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${learner.admissionNo}</td>
                <td>${learner.fullName}</td>
                <td>${learner.gender}</td>
                <td>${learner.dob}</td>
                <td>${learner.grade}</td>
                <td>${learner.assessmentNumber || 'N/A'}</td>
                <td>${learner.parentName}</td>
                <td>${learner.parentPhone}</td>
                <td>
                    <button onclick="editLearner('${learner._id}', ${start + index})">Edit</button>
                    <button onclick="deleteLearner('${learner._id}')">Delete</button>
                </td>
            `;
            learnersBody.appendChild(row);
        });

        document.getElementById('pageInfo').textContent = `Showing ${start + 1} to ${Math.min(end, learners.length)} of ${learners.length} entries`;
    }

    function renderFees() {
        feesBody.innerHTML = '';
        if (fees.length === 0) {
            feesBody.innerHTML = '<tr><td colspan="6">No fee records available.</td></tr>';
            return;
        }
        fees.forEach((fee, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${fee.admissionNo}</td>
                <td>${learners.find(l => l.admissionNo === fee.admissionNo)?.fullName || 'N/A'}</td>
                <td>${fee.term}</td>
                <td>${fee.amountPaid}</td>
                <td>${fee.balance}</td>
                <td>
                    <button onclick="editFee('${fee._id}', ${index})">Edit</button>
                    <button onclick="deleteFee('${fee._id}')">Delete</button>
                </td>
            `;
            feesBody.appendChild(row);
        });
    }

    function renderBooks() {
        booksBody.innerHTML = '';
        books.forEach((book, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.admissionNo}</td>
                <td>${learners.find(l => l.admissionNo === book.admissionNo)?.fullName || 'N/A'}</td>
                <td>${book.subject}</td>
                <td>${book.bookTitle}</td>
                <td>
                    <button onclick="editBook('${book._id}', ${index})">Edit</button>
                    <button onclick="deleteBook('${book._id}')">Delete</button>
                </td>
            `;
            booksBody.appendChild(row);
        });
    }

    function renderClassBooks() {
        classBooksBody.innerHTML = '';
        classBooks.forEach((book, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.bookNumber}</td>
                <td>${book.subject}</td>
                <td>${book.description}</td>
                <td>${book.totalBooks}</td>
                <td>
                    <button onclick="editClassBook('${book._id}', ${index})">Edit</button>
                    <button onclick="deleteClassBook('${book._id}')">Delete</button>
                </td>
            `;
            classBooksBody.appendChild(row);
        });
    }

    addLearnerBtn.addEventListener('click', () => {
        addLearnerForm.style.display = 'block';
        document.getElementById('assessmentNumber').style.display = 'none';
        document.getElementById('grade').addEventListener('change', function() {
            const grade = this.value;
            const assessmentNumberInput = document.getElementById('assessmentNumber');
            if (['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].includes(grade)) {
                assessmentNumberInput.style.display = 'block';
            } else {
                assessmentNumberInput.style.display = 'none';
                assessmentNumberInput.value = '';
            }
        });
    });

    learnerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const learner = {
            admissionNo: getNextAdmissionNo(),
            fullName: document.getElementById('fullName').value,
            gender: document.getElementById('gender').value,
            dob: document.getElementById('dob').value,
            grade: document.getElementById('grade').value,
            assessmentNumber: document.getElementById('assessmentNumber').value || undefined,
            parentName: document.getElementById('parentName').value,
            parentPhone: document.getElementById('parentPhone').value,
            parentEmail: document.getElementById('parentEmail').value
        };
        try {
            const response = await fetch('/api/learners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(learner)
            });
            const newLearner = await response.json();
            learners.push(newLearner);
            learnerForm.reset();
            addLearnerForm.style.display = 'none';
            renderLearners();
        } catch (err) {
            console.error('Error adding learner:', err);
        }
    });

    window.editLearner = (id, index) => {
        const learner = learners.find(l => l._id === id);
        document.getElementById('editLearnerIndex').value = index;
        document.getElementById('editFullName').value = learner.fullName;
        document.getElementById('editGender').value = learner.gender;
        document.getElementById('editDob').value = learner.dob;
        document.getElementById('editGrade').value = learner.grade;
        document.getElementById('editAssessmentNumber').value = learner.assessmentNumber || '';
        document.getElementById('editParentName').value = learner.parentName;
        document.getElementById('editParentPhone').value = learner.parentPhone;
        document.getElementById('editParentEmail').value = learner.parentEmail;
        document.getElementById('editAssessmentNumber').style.display = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].includes(learner.grade) ? 'block' : 'none';
        editLearnerForm.style.display = 'block';
    };

    editLearnerFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const index = document.getElementById('editLearnerIndex').value;
        const learner = {
            fullName: document.getElementById('editFullName').value,
            gender: document.getElementById('editGender').value,
            dob: document.getElementById('editDob').value,
            grade: document.getElementById('editGrade').value,
            assessmentNumber: document.getElementById('editAssessmentNumber').value || undefined,
            parentName: document.getElementById('editParentName').value,
            parentPhone: document.getElementById('editParentPhone').value,
            parentEmail: document.getElementById('editParentEmail').value
        };
        try {
            const response = await fetch(`/api/learners/${learners[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(learner)
            });
            const updatedLearner = await response.json();
            learners[index] = updatedLearner;
            editLearnerForm.style.display = 'none';
            renderLearners();
        } catch (err) {
            console.error('Error updating learner:', err);
        }
    });

    addFeeBtn.addEventListener('click', () => {
        document.getElementById('feeAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}">${l.admissionNo} - ${l.fullName}</option>`).join('');
        document.getElementById('term').value = currentTerm;
        addFeeForm.style.display = 'block';
    });

    feeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const admissionNo = document.getElementById('feeAdmissionNo').value;
        const term = document.getElementById('term').value;
        const amountPaid = parseFloat(document.getElementById('amountPaid').value);
        const learner = learners.find(l => l.admissionNo === admissionNo);
        const feePerTerm = feeStructure[learner.grade.replace(' ', '').toLowerCase()] || 0;
        let balance = feePerTerm - amountPaid;
        let nextTermBalance = 0;

        if (balance < 0) {
            nextTermBalance = Math.abs(balance);
            balance = 0;
            if (term === 'Term 1') await updateNextTermFee(admissionNo, 'Term 2', nextTermBalance);
            if (term === 'Term 2') await updateNextTermFee(admissionNo, 'Term 3', nextTermBalance);
        }

        const fee = { admissionNo, term, amountPaid, balance };
        try {
            const response = await fetch('/api/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fee)
            });
            const newFee = await response.json();
            fees.push(newFee);
            feeForm.reset();
            addFeeForm.style.display = 'none';
            renderFees();
            await sendFeeNotification(learner, newFee);
        } catch (err) {
            console.error('Error adding fee:', err);
        }
    });

    async function updateNextTermFee(admissionNo, nextTerm, amount) {
        const existingFee = fees.find(f => f.admissionNo === admissionNo && f.term === nextTerm);
        if (existingFee) {
            existingFee.amountPaid += amount;
            existingFee.balance = feeStructure[learners.find(l => l.admissionNo === admissionNo).grade.replace(' ', '').toLowerCase()] - existingFee.amountPaid;
            await fetch(`/api/fees/${existingFee._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(existingFee)
            });
        } else {
            const fee = { admissionNo, term: nextTerm, amountPaid: amount, balance: feeStructure[learners.find(l => l.admissionNo === admissionNo).grade.replace(' ', '').toLowerCase()] - amount };
            await fetch('/api/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fee)
            });
        }
    }

    async function sendFeeNotification(learner, fee) {
        const message = `Dear ${learner.parentName}, your child ${learner.fullName} (Admission No: ${fee.admissionNo}, Grade: ${learner.grade}) has a fee balance of ${fee.balance} for ${fee.term} ${currentYear}.`;
        try {
            await fetch('/api/sendNotification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: learner.parentPhone,
                    email: learner.parentEmail,
                    message
                })
            });
        } catch (err) {
            console.error('Error sending notification:', err);
        }
    }

    window.editFee = (id, index) => {
        const fee = fees.find(f => f._id === id);
        document.getElementById('editFeeIndex').value = index;
        document.getElementById('editFeeAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}" ${l.admissionNo === fee.admissionNo ? 'selected' : ''}>${l.admissionNo} - ${l.fullName}</option>`).join('');
        document.getElementById('editTerm').value = fee.term;
        document.getElementById('editAmountPaid').value = fee.amountPaid;
        editFeeForm.style.display = 'block';
    };

    editFeeFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const index = document.getElementById('editFeeIndex').value;
        const admissionNo = document.getElementById('editFeeAdmissionNo').value;
        const term = document.getElementById('editTerm').value;
        const amountPaid = parseFloat(document.getElementById('editAmountPaid').value);
        const learner = learners.find(l => l.admissionNo === admissionNo);
        const feePerTerm = feeStructure[learner.grade.replace(' ', '').toLowerCase()] || 0;
        let balance = feePerTerm - amountPaid;
        let nextTermBalance = 0;

        if (balance < 0) {
            nextTermBalance = Math.abs(balance);
            balance = 0;
            if (term === 'Term 1') await updateNextTermFee(admissionNo, 'Term 2', nextTermBalance);
            if (term === 'Term 2') await updateNextTermFee(admissionNo, 'Term 3', nextTermBalance);
        }

        const fee = { admissionNo, term, amountPaid, balance };
        try {
            const response = await fetch(`/api/fees/${fees[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fee)
            });
            const updatedFee = await response.json();
            fees[index] = updatedFee;
            editFeeForm.style.display = 'none';
            renderFees();
            await sendFeeNotification(learner, updatedFee);
        } catch (err) {
            console.error('Error updating fee:', err);
        }
    });

    addBookBtn.addEventListener('click', () => {
        document.getElementById('bookAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}">${l.admissionNo} - ${l.fullName}</option>`).join('');
        addBookForm.style.display = 'block';
    });

    bookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const book = {
            admissionNo: document.getElementById('bookAdmissionNo').value,
            subject: document.getElementById('subject').value,
            bookTitle: document.getElementById('bookTitle').value
        };
        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });
            const newBook = await response.json();
            books.push(newBook);
            bookForm.reset();
            addBookForm.style.display = 'none';
            renderBooks();
        } catch (err) {
            console.error('Error adding book:', err);
        }
    });

    window.editBook = (id, index) => {
        const book = books.find(b => b._id === id);
        document.getElementById('editBookIndex').value = index;
        document.getElementById('editBookAdmissionNo').innerHTML = learners.map(l => `<option value="${l.admissionNo}" ${l.admissionNo === book.admissionNo ? 'selected' : ''}>${l.admissionNo} - ${l.fullName}</option>`).join('');
        document.getElementById('editSubject').value = book.subject;
        document.getElementById('editBookTitle').value = book.bookTitle;
        editBookForm.style.display = 'block';
    };

    editBookFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const index = document.getElementById('editBookIndex').value;
        const book = {
            admissionNo: document.getElementById('editBookAdmissionNo').value,
            subject: document.getElementById('editSubject').value,
            bookTitle: document.getElementById('editBookTitle').value
        };
        try {
            const response = await fetch(`/api/books/${books[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });
            const updatedBook = await response.json();
            books[index] = updatedBook;
            editBookForm.style.display = 'none';
            renderBooks();
        } catch (err) {
            console.error('Error updating book:', err);
        }
    });

    addClassBookBtn.addEventListener('click', () => addClassBookForm.style.display = 'block');

    classBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const book = {
            bookNumber: document.getElementById('bookNumber').value,
            subject: document.getElementById('classSubject').value,
            description: document.getElementById('bookDescription').value,
            totalBooks: document.getElementById('totalBooks').value
        };
        try {
            const response = await fetch('/api/classBooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });
            const newClassBook = await response.json();
            classBooks.push(newClassBook);
            classBookForm.reset();
            addClassBookForm.style.display = 'none';
            renderClassBooks();
        } catch (err) {
            console.error('Error adding class book:', err);
        }
    });

    window.editClassBook = (id, index) => {
        const book = classBooks.find(b => b._id === id);
        document.getElementById('editClassBookIndex').value = index;
        document.getElementById('editBookNumber').value = book.bookNumber;
        document.getElementById('editClassSubject').value = book.subject;
        document.getElementById('editBookDescription').value = book.description;
        document.getElementById('editTotalBooks').value = book.totalBooks;
        editClassBookForm.style.display = 'block';
    };

    editClassBookFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const index = document.getElementById('editClassBookIndex').value;
        const book = {
            bookNumber: document.getElementById('editBookNumber').value,
            subject: document.getElementById('editClassSubject').value,
            description: document.getElementById('editBookDescription').value,
            totalBooks: document.getElementById('editTotalBooks').value
        };
        try {
            const response = await fetch(`/api/classBooks/${classBooks[index]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });
            const updatedClassBook = await response.json();
            classBooks[index] = updatedClassBook;
            editClassBookForm.style.display = 'none';
            renderClassBooks();
        } catch (err) {
            console.error('Error updating class book:', err);
        }
    });

    window.deleteLearner = async (id) => {
        if (confirm('Are you sure you want to delete this learner?')) {
            try {
                await fetch(`/api/learners/${id}`, { method: 'DELETE' });
                learners = learners.filter(l => l._id !== id);
                renderLearners();
            } catch (err) {
                console.error('Error deleting learner:', err);
            }
        }
    };

    window.deleteFee = async (id) => {
        if (confirm('Are you sure you want to delete this fee record?')) {
            try {
                await fetch(`/api/fees/${id}`, { method: 'DELETE' });
                fees = fees.filter(f => f._id !== id);
                renderFees();
            } catch (err) {
                console.error('Error deleting fee:', err);
            }
        }
    };

    window.deleteBook = async (id) => {
        if (confirm('Are you sure you want to delete this book record?')) {
            try {
                await fetch(`/api/books/${id}`, { method: 'DELETE' });
                books = books.filter(b => b._id !== id);
                renderBooks();
            } catch (err) {
                console.error('Error deleting book:', err);
            }
        }
    };

    window.deleteClassBook = async (id) => {
        if (confirm('Are you sure you want to delete this class book record?')) {
            try {
                await fetch(`/api/classBooks/${id}`, { method: 'DELETE' });
                classBooks = classBooks.filter(cb => cb._id !== id);
                renderClassBooks();
            } catch (err) {
                console.error('Error deleting class book:', err);
            }
        }
    };

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderLearners();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage * entriesPerPage < learners.length) {
            currentPage++;
            renderLearners();
        }
    });

    document.querySelectorAll('.sidebar a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = a.getAttribute('href').substring(1);
            console.log('Clicked section:', sectionId); // Debug: Log the section ID

            // Hide all sections
            document.querySelectorAll('section').forEach(s => {
                s.style.display = 'none';
                console.log(`Hiding section: ${s.id}`); // Debug: Log which sections are being hidden
            });

            // Show the target section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
                console.log(`Showing section: ${sectionId}`); // Debug: Confirm the section is shown
            } else {
                console.error(`Section with ID ${sectionId} not found!`);
            }

            // Render specific content based on section
            if (sectionId === 'fees') {
                renderFees();
            } else if (sectionId === 'learners') {
                renderLearners();
            } else if (sectionId === 'books') {
                renderBooks();
            } else if (sectionId === 'classBooks') {
                renderClassBooks();
            } else if (sectionId === 'feeStructure') {
                loadFeeStructure();
            }

            sidebar.classList.remove('active');
        });
    });

    document.querySelectorAll('.close, .cancel').forEach(el => {
        el.addEventListener('click', () => {
            addLearnerForm.style.display = 'none';
            addFeeForm.style.display = 'none';
            addBookForm.style.display = 'none';
            addClassBookForm.style.display = 'none';
            editLearnerForm.style.display = 'none';
            editFeeForm.style.display = 'none';
            editBookForm.style.display = 'none';
            editClassBookForm.style.display = 'none';
        });
    });

    async function fetchArchivedYears() {
        try {
            const response = await fetch('/api/learnerArchives/years');
            const years = await response.json();
            const select = document.getElementById('learnerYearSelect');
            select.innerHTML = `<option value="${currentYear}">${currentYear} (Current)</option>` +
                years.map(year => `<option value="${year}">${year}</option>`).join('');
        } catch (err) {
            console.error('Error fetching archived years:', err);
        }
    }

    feeStructureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newFeeStructure = {
            playgroup: parseFloat(document.getElementById('playgroupFee').value),
            pp1: parseFloat(document.getElementById('pp1Fee').value),
            pp2: parseFloat(document.getElementById('pp2Fee').value),
            grade1: parseFloat(document.getElementById('grade1Fee').value),
            grade2: parseFloat(document.getElementById('grade2Fee').value),
            grade3: parseFloat(document.getElementById('grade3Fee').value),
            grade4: parseFloat(document.getElementById('grade4Fee').value),
            grade5: parseFloat(document.getElementById('grade5Fee').value),
            grade6: parseFloat(document.getElementById('grade6Fee').value),
            grade7: parseFloat(document.getElementById('grade7Fee').value),
            grade8: parseFloat(document.getElementById('grade8Fee').value),
            grade9: parseFloat(document.getElementById('grade9Fee').value)
        };
        try {
            await fetch('/api/feeStructure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFeeStructure)
            });
            feeStructure = newFeeStructure;
            alert('Fee structure saved successfully');
        } catch (err) {
            console.error('Error saving fee structure:', err);
        }
    });

    function loadFeeStructure() {
        document.getElementById('playgroupFee').value = feeStructure.playgroup || '';
        document.getElementById('pp1Fee').value = feeStructure.pp1 || '';
        document.getElementById('pp2Fee').value = feeStructure.pp2 || '';
        document.getElementById('grade1Fee').value = feeStructure.grade1 || '';
        document.getElementById('grade2Fee').value = feeStructure.grade2 || '';
        document.getElementById('grade3Fee').value = feeStructure.grade3 || '';
        document.getElementById('grade4Fee').value = feeStructure.grade4 || '';
        document.getElementById('grade5Fee').value = feeStructure.grade5 || '';
        document.getElementById('grade6Fee').value = feeStructure.grade6 || '';
        document.getElementById('grade7Fee').value = feeStructure.grade7 || '';
        document.getElementById('grade8Fee').value = feeStructure.grade8 || '';
        document.getElementById('grade9Fee').value = feeStructure.grade9 || '';
    }

    termSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const settings = {
            currentTerm: document.getElementById('currentTerm').value,
            currentYear: parseInt(document.getElementById('currentYear').value)
        };
        try {
            await fetch('/api/termSettings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            currentTerm = settings.currentTerm;
            currentYear = settings.currentYear;
            document.getElementById('currentTermYear').textContent = `${currentTerm} ${currentYear}`;
            alert('Term settings saved successfully');
        } catch (err) {
            console.error('Error saving term settings:', err);
        }
    });

    // Download Functions
    function downloadExcel(data, headers, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    function downloadWord(data, headers, filename) {
        // Create HTML table content
        const htmlContent = `
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>${headers.map(h => `<th style="background-color: #3498db; color: white; padding: 8px;">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr>${row.map(cell => `<td style="padding: 8px;">${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        `;
        
        // Convert HTML to Word document
        const doc = htmlDocx.asBlob(htmlContent);
        const url = URL.createObjectURL(doc);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.docx`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadPdf(data, headers, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.autoTable({
            head: [headers],
            body: data,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [52, 152, 219] }, // Blue header
        });
        doc.save(`${filename}.pdf`);
    }

    document.getElementById('downloadLearnersExcelBtn').addEventListener('click', async () => {
        const selectedYear = document.getElementById('learnerYearSelect').value;
        const learnersData = selectedYear === currentYear.toString() ? learners : await fetch(`/api/learnerArchives/${selectedYear}`).then(res => res.json());
        const data = learnersData.map(l => [l.admissionNo, l.fullName, l.gender, l.dob, l.grade, l.assessmentNumber || 'N/A', l.parentName, l.parentPhone]);
        downloadExcel(data, ['Admission No.', 'Full Name', 'Gender', 'DoB', 'Grade', 'Assessment Number', 'Parent Name', 'Parent Contact'], `learners_${selectedYear}`);
    });

    document.getElementById('downloadLearnersWordBtn').addEventListener('click', async () => {
        const selectedYear = document.getElementById('learnerYearSelect').value;
        const learnersData = selectedYear === currentYear.toString() ? learners : await fetch(`/api/learnerArchives/${selectedYear}`).then(res => res.json());
        const data = learnersData.map(l => [l.admissionNo, l.fullName, l.gender, l.dob, l.grade, l.assessmentNumber || 'N/A', l.parentName, l.parentPhone]);
        downloadWord(data, ['Admission No.', 'Full Name', 'Gender', 'DoB', 'Grade', 'Assessment Number', 'Parent Name', 'Parent Contact'], `learners_${selectedYear}`);
    });

    document.getElementById('downloadLearnersPdfBtn').addEventListener('click', async () => {
        const selectedYear = document.getElementById('learnerYearSelect').value;
        const learnersData = selectedYear === currentYear.toString() ? learners : await fetch(`/api/learnerArchives/${selectedYear}`).then(res => res.json());
        const data = learnersData.map(l => [l.admissionNo, l.fullName, l.gender, l.dob, l.grade, l.assessmentNumber || 'N/A', l.parentName, l.parentPhone]);
        downloadPdf(data, ['Admission No.', 'Full Name', 'Gender', 'DoB', 'Grade', 'Assessment Number', 'Parent Name', 'Parent Contact'], `learners_${selectedYear}`);
    });

    document.getElementById('downloadFeesExcelBtn').addEventListener('click', () => {
        const data = fees.map(f => [f.admissionNo, learners.find(l => l.admissionNo === f.admissionNo)?.fullName || 'N/A', f.term, f.amountPaid, f.balance]);
        downloadExcel(data, ['Admission No.', 'Full Name', 'Term', 'Amount Paid', 'Balance'], 'fees');
    });

    document.getElementById('downloadFeesWordBtn').addEventListener('click', () => {
        const data = fees.map(f => [f.admissionNo, learners.find(l => l.admissionNo === f.admissionNo)?.fullName || 'N/A', f.term, f.amountPaid, f.balance]);
        downloadWord(data, ['Admission No.', 'Full Name', 'Term', 'Amount Paid', 'Balance'], 'fees');
    });

    document.getElementById('downloadFeesPdfBtn').addEventListener('click', () => {
        const data = fees.map(f => [f.admissionNo, learners.find(l => l.admissionNo === f.admissionNo)?.fullName || 'N/A', f.term, f.amountPaid, f.balance]);
        downloadPdf(data, ['Admission No.', 'Full Name', 'Term', 'Amount Paid', 'Balance'], 'fees');
    });

    document.getElementById('downloadBooksExcelBtn').addEventListener('click', () => {
        const data = books.map(b => [b.admissionNo, learners.find(l => l.admissionNo === b.admissionNo)?.fullName || 'N/A', b.subject, b.bookTitle]);
        downloadExcel(data, ['Admission No.', 'Full Name', 'Subject', 'Book Title'], 'books');
    });

    document.getElementById('downloadBooksWordBtn').addEventListener('click', () => {
        const data = books.map(b => [b.admissionNo, learners.find(l => l.admissionNo === b.admissionNo)?.fullName || 'N/A', b.subject, b.bookTitle]);
        downloadWord(data, ['Admission No.', 'Full Name', 'Subject', 'Book Title'], 'books');
    });

    document.getElementById('downloadBooksPdfBtn').addEventListener('click', () => {
        const data = books.map(b => [b.admissionNo, learners.find(l => l.admissionNo === b.admissionNo)?.fullName || 'N/A', b.subject, b.bookTitle]);
        downloadPdf(data, ['Admission No.', 'Full Name', 'Subject', 'Book Title'], 'books');
    });

    document.getElementById('newAcademicYearBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to start a new academic year? This will archive the current year\'s data and update learners\' grades.')) {
            try {
                const response = await fetch('/api/newAcademicYear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) throw new Error('Failed to start new academic year');
                alert('New academic year started successfully');
                await fetchData();
                await fetchArchivedYears();
            } catch (err) {
                console.error('Error:', err);
                alert('Error: ' + err.message);
            }
        }
    });
});