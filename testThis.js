




var now = new Date();
console.log(now.getMinutes());

console.log(now);

var searchTerm = "vim";
var re = new RegExp("\\b" + searchTerm + "\\b", "gi");
if (("vism jdfskjfdmgoTime vim").match(re)) {
    console.log("GOT YA");
}
