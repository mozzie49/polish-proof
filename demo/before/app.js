const dialog = document.querySelector('#lesson-dialog');
const status = document.querySelector('#status');
for (const id of ['continue', 'explore', 'review']) {
  document.querySelector(`#${id}`).addEventListener('click', () => dialog.showModal());
}
document.querySelector('#quiz').addEventListener('submit', event => {
  event.preventDefault();
  const correct = new FormData(event.currentTarget).get('answer') === 'context';
  document.querySelector('#feedback').textContent = correct ? 'Exactly. Context helps us find meaning.' : 'Try again. Look at the words around it.';
  if (correct) status.textContent = 'One idea revisited. Nicely done.';
});
document.querySelector('#search').addEventListener('input', event => {
  const query = event.target.value.toLowerCase();
  const lessons = [...document.querySelectorAll('.lesson')];
  lessons.forEach(lesson => { lesson.hidden = !lesson.textContent.toLowerCase().includes(query); });
  document.querySelector('#no-results').hidden = lessons.some(lesson => !lesson.hidden);
});
document.querySelector('#help').addEventListener('click', () => {
  status.textContent = 'Choose a lesson to begin. Your progress stays on this device.';
});
