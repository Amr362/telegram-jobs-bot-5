{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
    pkgs.git
    pkgs.curl
    pkgs.wget
    pkgs.unzip
    pkgs.python3
    pkgs.python3Packages.pip
  ];
  
  env = {
    NODE_ENV = "production";
    NPM_CONFIG_PREFIX = "/home/runner/.npm-global";
    PATH = "/home/runner/.npm-global/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";
  };
}

