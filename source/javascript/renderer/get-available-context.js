export default function (canvas, contextList) {
  if (canvas.getContext) {
    for (let i = 0; i < contextList.length; ++i) {
      try {
        const context = canvas.getContext(contextList[i], { antialias:false });

        if(context !== null) {
          return context;
        }
      } catch (ex) {
        console.log(ex); // eslint-disable-line
      }
    }
  }
  
  return null;
}
