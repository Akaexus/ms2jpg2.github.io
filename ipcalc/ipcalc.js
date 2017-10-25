class ipv4 {
  constructor(ip, mask) {
    this.address = ip.split('.').map((item)=>{
      var oct = parseInt(item);
      if(isNaN(oct)) {
        return 0;
      }
      return oct>255?255:(oct<0?0:oct);
    });
    this.cidr = parseInt(mask.match(/\d/g).join(''));
    if(!(this.cidr>=0 && this.cidr<=32)) {
      this.cidr = 24;
    }
    this.mask = this.calcMask(this.cidr);
    this.networkAddress = this.calcNetworkAddress(this.address, this.mask);
    this.broadcastAddress = this.calcBroadcast(this.networkAddress, this.mask);
    this.numberOfHosts = this.calcNumberOfHosts(this.cidr);
  }
  calcMask(cidr) {
    var mask = [0, 0, 0, 0];
    for(var i=1, tempmask = cidr; i<=32; i++, tempmask--) {
      //console.log('i: %d | tempmask: %d | oct: %d | power: %d', i, tempmask, parseInt((i-1)/8), Math.pow(2, 8-(i%8 || 8)));
      if(tempmask>0) {
        mask[parseInt((i-1)/8)]+=Math.pow(2, 8-(i%8 || 8));
      }
    }
    return mask;
  }
  calcNetworkAddress(address, mask) {
    var networkAddress = [0, 0, 0, 0].map((item, index, array)=> {
      return address[index] & mask[index];
    });
    return networkAddress;
  }
  calcBroadcast(networkAddress, mask) {
    var broadcastAddress = [0, 0, 0, 0].map((item, index, array)=> {
      return networkAddress[index]+255-mask[index];
    });
    return broadcastAddress;
  }
  calcNumberOfHosts(cidr) {
    return Math.pow(2, 32-cidr)-2;
  }
  calcSubnets(numberOfSubnets) {
    var temp = 0;
    while(Math.pow(2, temp)<numberOfSubnets) {
      temp++;
    }
    var newmask = this.cidr+temp;
    if(newmask>32) {
      return false;
    }
    var hop = Math.pow(2, newmask%8?8-newmask%8:0),
        oct = newmask<=8?0:(newmask<=16?1:(newmask<=24?2:3)),
        subnetsInfo = {
          subnetCIDR: newmask,
          subnetMask: this.calcMask(newmask),
          subnetHop: hop,
          usedSubnets: numberOfSubnets,
          unusedSubnets: Math.pow(2, temp)-numberOfSubnets,
          numberOfHostsInSubnet: this.calcNumberOfHosts(newmask),
          subnets: [this.networkAddress]
        };
    for(var i=1; i<numberOfSubnets; i++) {
      var subnet = JSON.parse(JSON.stringify(subnetsInfo.subnets[i-1]));
      subnet[oct]+=hop;
      for(var j=3; j>0; j--) {
        if(subnet[j]==256) {
          subnet[j]=0;
          subnet[j-1]++;
        }
      }
      subnetsInfo.subnets.push(subnet);
    }
    return subnetsInfo;
  }
  getInfo() {
    var temp = {
      address: this.address,
      cidr: this.cidr,
      mask: this.mask,
      networkAddress: this.networkAddress,
      broadcastAddress: this.broadcastAddress,
      numberOfHosts: this.numberOfHosts
    }
    return temp;
  }
}

function $(e) {
  return document.querySelector(e);
}

function calc(event) {
  var ip = $('#ip').value,
      mask = $('#maskPrompt').value,
      subnets = parseInt($('#subnetsPrompt').value);
  var x = new ipv4(ip, mask);
  var info = x.getInfo();
  for(attrib in info) {
    $('#'+attrib).innerHTML = typeof info[attrib] == 'object' ? info[attrib].join('.'):info[attrib];
  }
  if(subnets>1) {
    var subnets = x.calcSubnets(subnets);
    for(attrib in subnets) {
      if(attrib!='subnets') {
        $('#'+attrib).innerHTML = typeof subnets[attrib] === 'object' ? subnets[attrib].join('.') : subnets[attrib];
      }
    }
    $('#subnets > tbody').innerHTML = '';
    for(var i=0; i<subnets.subnets.length; i++) {
      $('#subnets > tbody').innerHTML+='<tr><td>#'+(i+1)+'</td><td>'+subnets.subnets[i].join('.')+'/'+subnets.subnetCIDR+'</td></tr>';
    }
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  var inputs = Array.from(document.querySelectorAll('input'));
  inputs.forEach((input) => {
    input.addEventListener('input', calc);
  });
})
