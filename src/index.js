const BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', fetchFilms);

function fetchFilms() {
  fetch(`${BASE_URL}/films`)
    .then(response => response.json())
    .then(films => {
      displayFilmMenu(films);
      displayFilmDetails(films[0]); // Display the first film by default
    })
    .catch(error => console.error('Error fetching films:', error));
}

function displayFilmMenu(films) {
  const filmsList = document.getElementById('films');
  filmsList.innerHTML = ''; // Clear any existing films

  films.forEach(film => {
    const li = document.createElement('li');
    li.classList.add('film', 'item');
    li.textContent = film.title;
    li.dataset.id = film.id;

    // Check if sold out
    const ticketsAvailable = film.capacity - film.tickets_sold;
    if (ticketsAvailable === 0) {
      li.classList.add('sold-out');
    }

    // Add Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering the film selection
      deleteFilm(film.id);
    });
    li.appendChild(deleteBtn);

    // Add Event Listener for Film Selection
    li.addEventListener('click', () => displayFilmDetails(film));

    filmsList.appendChild(li);
  });
}

function displayFilmDetails(film) {
    const filmDetails = document.getElementById('showing');
    filmDetails.innerHTML = ''; // Clear existing details
  
    // Create elements for film details
    const title = document.createElement('div');
    title.id = 'title';
    title.className = 'title';
    title.textContent = film.title;
  
    const runtime = document.createElement('div');
    runtime.id = 'runtime';
    runtime.className = 'meta';
    runtime.textContent = `${film.runtime} minutes`;
  
    const description = document.createElement('div');
    description.id = 'film-info';
    description.textContent = film.description;
  
    const availableTickets = document.createElement('div');
    availableTickets.id = 'tickets-available';
    const ticketsAvailable = film.capacity - film.tickets_sold;
    availableTickets.textContent = `Tickets Available: ${ticketsAvailable}`;
  
    const buyButton = document.createElement('button');
    buyButton.id = 'buy-ticket-btn';
    buyButton.className = 'ui orange button';
    buyButton.textContent = 'Buy Ticket';
    buyButton.disabled = ticketsAvailable === 0;
    buyButton.addEventListener('click', () => buyTicket(film));
  
    // Create the poster image
    const poster = document.createElement('img');
    poster.src = film.poster; // Set the image source to the film's poster URL
    poster.alt = `${film.title} Poster`; // Alt text for accessibility
    poster.style.maxWidth = '100%'; // Optional: style to make it responsive
  
    // Append elements to filmDetails
    filmDetails.appendChild(poster); // Append the poster first
    filmDetails.appendChild(title);
    filmDetails.appendChild(runtime);
    filmDetails.appendChild(description);
    filmDetails.appendChild(availableTickets);
    filmDetails.appendChild(buyButton);
  }
  
  
function buyTicket(film) {
    const ticketsAvailable = film.capacity - film.tickets_sold;
  
    if (ticketsAvailable > 0) {
      const updatedTicketsSold = film.tickets_sold + 1;
  
      // Start countdown from the available tickets
      let remainingTickets = ticketsAvailable - 1; // Countdown starts from one less than current available
  
      // Update the UI to show countdown
      const ticketsAvailableElement = document.getElementById('tickets-available');
      
      const countdownInterval = setInterval(() => {
        ticketsAvailableElement.textContent = `Tickets Available: ${remainingTickets}`;
        remainingTickets--;
  
        // Stop the countdown when we reach zero
        if (remainingTickets < 0) {
          clearInterval(countdownInterval);
          ticketsAvailableElement.textContent = `Tickets Available: Sold Out`;
        }
      }, 1000); // Update every second
  
      // Update tickets_sold on the server
      fetch(`${BASE_URL}/films/${film.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tickets_sold: updatedTicketsSold })
      })
        .then(response => response.json())
        .then(updatedFilm => {
          // Update the film object
          film.tickets_sold = updatedFilm.tickets_sold;
  
          // If sold out, disable the buy button
          const buyButton = document.getElementById('buy-ticket-btn');
          if (film.capacity - film.tickets_sold === 0) {
            buyButton.textContent = 'Sold Out';
            buyButton.disabled = true;
            highlightSoldOutFilm(film.id);
          }
  
          // POST the new ticket
          postTicket(film.id, 1);
        })
        .catch(error => console.error('Error buying ticket:', error));
    } else {
      alert('Sorry, this movie is sold out!');
    }
  }
  

function postTicket(filmId, numberOfTickets) {
  fetch(`${BASE_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      film_id: filmId,
      number_of_tickets: numberOfTickets
    })
  })
    .then(response => response.json())
    .then(ticket => {
      console.log('Ticket purchased:', ticket);
      // Optionally, handle the ticket data
    })
    .catch(error => console.error('Error posting ticket:', error));
}

function deleteFilm(filmId) {
  if (confirm('Are you sure you want to delete this film?')) {
    fetch(`${BASE_URL}/films/${filmId}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (response.ok) {
          // Remove the film from the UI
          const filmsList = document.getElementById('films');
          const filmItem = filmsList.querySelector(`li[data-id="${filmId}"]`);
          if (filmItem) filmsList.removeChild(filmItem);

          // Clear film details if the deleted film was being displayed
          const currentFilmTitle = document.getElementById('film-details').querySelector('h2');
          if (currentFilmTitle && currentFilmTitle.dataset.id === filmId) {
            filmDetails.innerHTML = 'Select a film to see details.';
          }
        }
      })
      .catch(error => console.error('Error deleting film:', error));
  }
}

function highlightSoldOutFilm(filmId) {
  const filmsList = document.getElementById('films').children;
  for (let li of filmsList) {
    if (li.dataset.id === filmId) {
      li.classList.add('sold-out');
      break;
    }
  }
}
