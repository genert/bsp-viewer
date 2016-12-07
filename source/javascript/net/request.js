export default function (url) {
  return new Promise(function (success, failure) {
    var request = new XMLHttpRequest();

    request.addEventListener('load', () => {
      success(request.responseText);
    }, false);

    request.addEventListener('error', (e) => {
      failure(e);
    });

    request.open('GET', url, true);
    request.overrideMimeType('text/plain; charset=x-user-defined');
    request.setRequestHeader('Content-Type', 'text/plain');
    request.send(null);
  });
}
